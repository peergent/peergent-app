export type ConnectorPath = {
  peerId: string;
  d: string;
};

export function arePathsEqual(current: ConnectorPath[], next: ConnectorPath[]): boolean {
  if (current.length !== next.length) {
    return false;
  }

  return current.every(
    (path, index) =>
      path.peerId === next[index]?.peerId && path.d === next[index]?.d
  );
}

export function buildConnectorPathFromRects(
  containerRect: { left: number; top: number },
  managerRect: { left: number; top: number; width: number; height: number; bottom: number },
  cardRect: { left: number; top: number; width: number }
): string {
  const startX = managerRect.left + managerRect.width / 2 - containerRect.left;
  const startY = managerRect.bottom - containerRect.top;
  const endX = cardRect.left + cardRect.width / 2 - containerRect.left;
  const endY = cardRect.top - containerRect.top;
  const distanceY = Math.max(endY - startY, 40);
  const controlY = startY + distanceY * 0.52;

  return `M ${startX} ${startY} C ${startX} ${controlY}, ${endX} ${controlY}, ${endX} ${endY}`;
}

export function buildConnectorPaths(input: {
  peerIds: string[];
  containerRect: { left: number; top: number; width: number; height: number };
  managerRect: { left: number; top: number; width: number; height: number; bottom: number } | null;
  cardRects: Map<string, { left: number; top: number; width: number }>;
}): ConnectorPath[] {
  if (!input.managerRect || input.containerRect.width <= 0 || input.containerRect.height <= 0) {
    return [];
  }

  return input.peerIds.flatMap((peerId) => {
    const cardRect = input.cardRects.get(peerId);
    if (!cardRect) return [];

    return [
      {
        peerId,
        d: buildConnectorPathFromRects(input.containerRect, input.managerRect!, cardRect),
      },
    ];
  });
}
