export function navigateToProject(id: string | null) {
  location.hash = id ? `/p/${id}` : '/'
}
