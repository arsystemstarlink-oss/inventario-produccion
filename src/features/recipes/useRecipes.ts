import { useState } from 'react'
import type { Recipe, RecipeDraft } from '../../types'
import { loadRecipes, saveRecipes } from '../../storage/localStorage'
import { createId } from '../../lib/id'

export function useRecipes() {
  const [initial] = useState(loadRecipes)
  const [recipes, setRecipes] = useState<Recipe[]>(initial.data)
  const [error, setError] = useState<string | null>(initial.error)

  const commit = (next: Recipe[]): boolean => {
    const result = saveRecipes(next)
    if (!result.ok) {
      setError(result.error)
      return false
    }
    setRecipes(next)
    setError(null)
    return true
  }

  const addRecipe = (draft: RecipeDraft): boolean =>
    commit([...recipes, { id: createId(), ...draft }])

  const updateRecipe = (id: string, draft: RecipeDraft): boolean =>
    commit(
      recipes.map((recipe) => (recipe.id === id ? { id, ...draft } : recipe)),
    )

  const removeRecipe = (id: string): boolean =>
    commit(recipes.filter((recipe) => recipe.id !== id))

  return {
    recipes,
    addRecipe,
    updateRecipe,
    removeRecipe,
    error,
    clearError: () => setError(null),
  }
}
