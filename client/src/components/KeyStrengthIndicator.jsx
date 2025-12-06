function KeyStrengthIndicator({ strength, entropy, length }) {
  const colorClasses = {
    gray: 'bg-gray-300',
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500'
  };

  const textColorClasses = {
    gray: 'text-gray-600',
    red: 'text-red-600',
    orange: 'text-orange-600',
    yellow: 'text-yellow-600',
    green: 'text-green-600'
  };

  const showWarning = strength.level <= 2 && length > 0;
  const percentage = (strength.level / 5) * 100;
  const hasPassword = Boolean(length);

  return (
    <div className="space-y-2" data-name="key-strength-indicator" data-file="components/KeyStrengthIndicator.js">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--text-secondary)]">
          Надежность ключа:
        </span>
        <span className={`text-sm font-bold ${textColorClasses[strength.color]}`}>
          {strength.label}
        </span>
      </div>

      <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${colorClasses[strength.color]}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      {hasPassword && (
        <div className="flex items-start space-x-2 mt-2">
          <div className="icon-info text-sm text-[var(--text-secondary)] mt-0.5"></div>
          <div className="text-xs text-[var(--text-secondary)]">
            <p>{strength.description}</p>
            <p className="mt-1">Энтропия: {entropy} бит | Длина: {length} символов</p>
          </div>
        </div>
      )}

      {showWarning && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <div className="icon-alert-triangle text-red-500 mt-0.5"></div>
            <div>
              <p className="text-xs font-medium text-red-700">
                Внимание: Этот ключ может быть ненадежным!
              </p>
              <p className="text-xs text-red-600 mt-1">
                Рекомендуется использовать ключ длиной не менее 12 символов
                с комбинацией букв, цифр и специальных символов.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KeyStrengthIndicator;
