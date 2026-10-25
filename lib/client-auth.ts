/** Session expired or missing: send the user to the login page. Returns true if it did. */
export function redirectIfUnauthorized(res: Response) {
  if (res.status !== 401) return false;
  window.location.assign("/login");
  return true;
}
