export type ActionResult =
  | { success: true; message?: string }
  | { success: false; error: string };

export const ACTION_OK: ActionResult = { success: true };

export function actionError(error: string): ActionResult {
  return { success: false, error };
}
