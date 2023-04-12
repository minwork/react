export function convertHandlerNameToEventName(handlerName: string): string {
  const str = handlerName.substring(2);
  return str.charAt(0).toLowerCase() + str.substring(1);
}
