export function convertHandlerNameToEventName(handlerName: string): string {
  if (handlerName.startsWith('on')) {
    const str = handlerName.substring(2);
    return str.charAt(0).toLowerCase() + str.substring(1);
  } else {
    return handlerName;
  }
}
