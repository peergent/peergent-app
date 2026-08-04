let actionInvocationCount = 0;

export function incrementStrategyActionInvocationCount(): number {
  actionInvocationCount += 1;
  return actionInvocationCount;
}

export function getStrategyActionInvocationCount(): number {
  return actionInvocationCount;
}

export function resetStrategyActionInvocationCountForTests(): void {
  actionInvocationCount = 0;
}
