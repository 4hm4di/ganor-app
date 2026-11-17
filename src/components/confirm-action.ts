// Lets buttons in one form tell whose action is running. A ConfirmButton (e.g. Delete) wraps its
// formAction once; useFormStatus().action is then that wrapper while it runs, so Save buttons in the
// same form can just wait instead of showing "Saving…".
type Fn = (fd: FormData) => void | Promise<void>
const wrappers = new WeakMap<Fn, Fn>()
const marked = new WeakSet<object>()

export function confirmAction(fn: Fn): Fn {
  let w = wrappers.get(fn)
  if (!w) {
    w = (fd: FormData) => fn(fd)
    wrappers.set(fn, w)
    marked.add(w)
  }
  return w
}

export const isConfirmAction = (a: unknown) => typeof a === "function" && marked.has(a)
