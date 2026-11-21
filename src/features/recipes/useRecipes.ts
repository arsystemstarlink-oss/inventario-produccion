import { useRef, useState } from 'react'
import type { Recipe, RecipeDraft } from '../../types'
import { loadRecipes, saveRecipes } from '../../storage/localStorage'
import { createId } from '../../lib/id'

export function useRecipes() {
  const [initial] = useState(loadRecipes)
  const [recipes, setRecipes] = useState<Recipe[]>(initial.data)
  const [error, setError] = useState<string | null>(initial.error)
  const recipesRef = useRef<Recipe[]>(initial.data)

  const commit = (next: Recipe[]): boolean => {
    const result = saveRecipes(next)
    if (!result.ok) {
      setError(result.error)
      return false
    }
    recipesRef.current = next
    setRecipes(next)
    setError(null)
    return true
  }

  const update = (build: (current: Recipe[]) => Recipe[]): boolean =>
    commit(build(recipesRef.current))

  const addRecipe = (draft: RecipeDraft): boolean =>
    update((current) => [...current, { id: createId(), ...draft }])

  const restoreRecipe = (recipe: Recipe): boolean =>
    update((current) =>
      current.some((item) => item.id === recipe.id)
        ? current
        : [...current, recipe],
    )

  const updateRecipe = (id: string, draft: RecipeDraft): boolean =>
    update((current) =>
      current.map((recipe) => (recipe.id === id ? { id, ...draft } : recipe)),
    )

  const removeRecipe = (id: string): boolean =>
    update((current) => current.filter((recipe) => recipe.id !== id))

  return {
    recipes,
    addRecipe,
    restoreRecipe,
    updateRecipe,
    removeRecipe,
    error,
    clearError: () => setError(null),
  }
}
