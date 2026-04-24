const PROMOTION_LABELS = {
  q: "Ферзь",
  r: "Ладья",
  b: "Слон",
  n: "Конь",
};

function renderPromotionPiece(pieceRenderer, previewSize) {
  if (typeof pieceRenderer !== "function") {
    return null;
  }

  return pieceRenderer({
    squareWidth: previewSize,
    isDragging: false,
  });
}

export default function PromotionMenu({
  boardWidth,
  customPieces,
  promotionState,
  onSelect,
  onCancel,
}) {
  if (!promotionState) {
    return null;
  }

  const previewSize = Math.max(56, Math.min(88, Math.round(boardWidth / 5)));

  return (
    <div className="promotion-menu__backdrop" onClick={onCancel}>
      <div
        className="promotion-menu__dialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Выбор фигуры для превращения пешки"
      >
        <div className="promotion-menu__title">Выберите фигуру</div>
        <div className="promotion-menu__subtitle">
          Пешка дошла до последней горизонтали
        </div>

        <div className="promotion-menu__grid">
          {promotionState.options.map((option) => {
            const pieceKey = `${promotionState.color}${option.toUpperCase()}`;
            const pieceRenderer = customPieces[pieceKey];

            return (
              <button
                key={option}
                type="button"
                className="promotion-menu__option"
                onClick={() => onSelect(option)}
              >
                <span className="promotion-menu__piece">
                  {renderPromotionPiece(pieceRenderer, previewSize)}
                </span>
                <span className="promotion-menu__label">
                  {PROMOTION_LABELS[option] || option.toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="promotion-menu__cancel"
          onClick={onCancel}
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
