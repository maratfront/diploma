import React from 'react'

function CryptoInfo() {
  try {
    const [selectedCategory, setSelectedCategory] = React.useState('symmetric');
    const [selectedAlgorithm, setSelectedAlgorithm] = React.useState(null);

    const cryptoCategories = {
      symmetric: {
        title: 'Симметричное шифрование',
        description: 'Использует один ключ для шифрования и расшифровки',
        icon: 'key',
        color: 'from-blue-500 to-blue-600'
      },
      asymmetric: {
        title: 'Асимметричное шифрование',
        description: 'Использует пару ключей: открытый и закрытый',
        icon: 'key-round',
        color: 'from-purple-500 to-purple-600'
      },
      hash: {
        title: 'Хеш-функции',
        description: 'Односторонние функции для создания отпечатков данных',
        icon: 'hash',
        color: 'from-green-500 to-green-600'
      },
      modern: {
        title: 'Современные методы',
        description: 'Квантовая криптография и постквантовые алгоритмы',
        icon: 'cpu',
        color: 'from-orange-500 to-orange-600'
      }
    };

    const algorithms = {
      symmetric: [
        {
          name: 'AES (Advanced Encryption Standard)',
          keySize: '128, 192, 256 бит',
          security: 'Очень высокая',
          speed: 'Высокая',
          description: 'AES был принят правительством США в 2001 году как стандарт шифрования. Это симметричный блочный шифр, который работает с блоками данных размером 128 бит. Алгоритм использует сеть замещений и перестановок (SPN), выполняя несколько раундов шифрования для обеспечения максимальной безопасности.',
          technicalDetails: 'AES-256 выполняет 14 раундов шифрования, каждый из которых включает операции SubBytes, ShiftRows, MixColumns и AddRoundKey. Алгоритм устойчив к дифференциальному и линейному криптоанализу.',
          vulnerabilities: 'На данный момент не существует практических атак на AES при правильной реализации. Теоретические атаки требуют вычислительных ресурсов, превышающих возможности современных компьютеров.',
          realWorldExample: 'AES используется в протоколе TLS для защиты HTTPS-соединений, в системах шифрования дисков BitLocker и FileVault, а также в мессенджерах для end-to-end шифрования.',
          applications: ['HTTPS и TLS/SSL соединения', 'Шифрование файловых систем', 'VPN-туннели', 'Защита баз данных', 'Банковские системы', 'Мобильные приложения'],
          advantages: ['Стандарт NIST и международное признание', 'Оптимизирован для аппаратной реализации', 'Поддержка AES-NI инструкций процессора', 'Гибкость размеров ключей'],
          disadvantages: ['Уязвим к атакам по побочным каналам при неправильной реализации', 'Требует безопасного управления ключами', 'Квантовые компьютеры смогут взломать AES-128']
        },
        {
          name: 'DES (Data Encryption Standard)',
          keySize: '56 бит',
          security: 'Устаревшая',
          speed: 'Средняя',
          description: 'DES был разработан IBM в 1970-х и стандартизирован NIST в 1977 году. Это блочный шифр с размером блока 64 бита и эффективным размером ключа 56 бит (8 бит используются для проверки четности). Алгоритм использует сеть Фейстеля с 16 раундами.',
          technicalDetails: 'DES использует начальную и конечную перестановки, а также функцию раунда, основанную на операциях расширения, подстановки через S-блоки и перестановки P-блока.',
          vulnerabilities: 'В 1999 году Electronic Frontier Foundation продемонстрировала взлом DES менее чем за 24 часа. Короткий ключ делает алгоритм уязвимым к атаке полного перебора.',
          realWorldExample: 'DES использовался в банкоматах и платежных системах до 2000-х годов, но был заменен более стойкими алгоритмами.',
          applications: ['Legacy системы', 'Исторические архивы', 'Обучение криптографии', 'Компонент Triple-DES'],
          advantages: ['Хорошо изученный алгоритм', 'Простота реализации', 'Детерминированность'],
          disadvantages: ['Критически короткий ключ', 'Уязвимость к дифференциальному криптоанализу', 'Не соответствует современным требованиям безопасности']
        },
        {
          name: 'ChaCha20',
          keySize: '256 бит',
          security: 'Очень высокая',
          speed: 'Очень высокая',
          description: 'ChaCha20 - современный потоковый шифр, разработанный Даниэлем Бернстайном в 2008 году. Алгоритм основан на шифре Salsa20 и выполняет 20 раундов операций quarter-round для генерации ключевого потока. Использует 256-битный ключ и 96-битный nonce.',
          technicalDetails: 'ChaCha20 работает с 512-битным внутренним состоянием (16 × 32-битных слов) и выполняет операции ARX (Addition, Rotation, XOR). Каждый раунд состоит из 4 quarter-round операций, обеспечивающих высокую диффузию и стойкость к криптоанализу.',
          vulnerabilities: 'При правильной реализации и уникальных nonce не имеет известных практических уязвимостей. Критически важно никогда не использовать один nonce дважды с одним ключом.',
          realWorldExample: 'ChaCha20 используется в протоколе TLS 1.3 для HTTPS-соединений, в VPN-сервисах WireGuard, в мессенджере Signal, и является стандартом для Android-шифрования начиная с версии 4.4.',
          applications: ['TLS 1.3 и HTTPS', 'VPN (WireGuard)', 'Android disk encryption', 'Signal messenger', 'OpenSSH', 'Мобильные приложения'],
          advantages: ['Высокая производительность на ARM процессорах', 'Устойчивость к timing-атакам', 'Простота аппаратной реализации', 'Не требует AES-NI инструкций'],
          disadvantages: ['Меньше стандартизации чем AES', 'Требует строгого управления nonce', 'Относительно новый (с 2008 года)']
        },
        {
          name: 'Blowfish',
          keySize: '32-448 бит',
          security: 'Средняя',
          speed: 'Высокая',
          description: 'Блочный шифр с переменным размером ключа. Разработан Брюсом Шнайером в 1993 году.',
          applications: ['Архивация', 'Старые системы', 'Embedded системы'],
          advantages: ['Быстрота', 'Гибкость размера ключа', 'Отсутствие патентов'],
          disadvantages: ['Маленький размер блока', 'Уязвимости при больших объемах данных']
        },
        {
          name: 'Caesar Cipher',
          keySize: '1-25 позиций',
          security: 'Очень низкая',
          speed: 'Очень высокая',
          description: 'Простейший шифр замены, где каждая буква заменяется буквой, стоящей на фиксированное число позиций дальше в алфавите.',
          applications: ['Обучение', 'Исторические примеры'],
          advantages: ['Простота', 'Быстрота'],
          disadvantages: ['Легко взламывается', 'Нет реальной защиты']
        }
      ],
      asymmetric: [
        {
          name: 'RSA (Rivest-Shamir-Adleman)',
          keySize: '1024, 2048, 4096 бит',
          security: 'Высокая',
          speed: 'Низкая',
          description: 'RSA - это как магический почтовый ящик! Представьте, что у каждого человека есть два ключа: один он раздает всем (открытый), а другой хранит в секрете (закрытый). Любой может положить письмо в ящик открытым ключом, но открыть может только владелец секретного ключа.',
          simpleExplanation: 'Это решает главную проблему: как безопасно общаться с незнакомцем, не встречаясь лично для обмена паролями.',
          realWorldExample: 'Когда вы покупаете что-то в интернет-магазине, ваша банковская карта защищена RSA - вы можете безопасно отправить данные, даже не зная владельцев сайта лично.',
          applications: ['Интернет-покупки и банки', 'Электронная почта', 'Цифровые подписи документов', 'Безопасные сайты'],
          advantages: ['Не нужно встречаться для обмена паролями', 'Можно проверить подлинность документов'],
          disadvantages: ['Работает медленно', 'Требует больших ключей']
        },
        {
          name: 'ECC (Elliptic Curve Cryptography)',
          keySize: '160-521 бит',
          security: 'Очень высокая',
          speed: 'Средняя',
          description: 'Криптография на эллиптических кривых обеспечивает ту же безопасность, что и RSA, но с меньшими ключами.',
          applications: ['Мобильные устройства', 'IoT', 'Блокчейн', 'Современные протоколы'],
          advantages: ['Меньший размер ключей', 'Энергоэффективность'],
          disadvantages: ['Сложность реализации', 'Патентные ограничения']
        },
        {
          name: 'Ed25519',
          keySize: '256 бит',
          security: 'Очень высокая',
          speed: 'Высокая',
          description: 'Современная схема цифровых подписей на основе кривых Эдвардса. Используется в SSH, Git, Signal.',
          applications: ['SSH ключи', 'Git подписи', 'Signal протокол', 'Tor сеть'],
          advantages: ['Высокая скорость', 'Детерминированные подписи', 'Устойчивость к атакам'],
          disadvantages: ['Только подписи', 'Не подходит для шифрования']
        }
      ],
      hash: [
        {
          name: 'SHA-256 (Secure Hash Algorithm)',
          keySize: '256 бит вывод',
          security: 'Очень высокая',
          speed: 'Высокая',
          description: 'SHA-256 - это как цифровой "отпечаток пальца" для любого файла или текста! Какой бы большой ни был ваш файл - фильм, книга или одно слово - SHA-256 всегда создаст короткий уникальный код длиной 64 символа.',
          simpleExplanation: 'Представьте машину, которая любой предмет (даже целый дом!) превращает в уникальную визитную карточку. По карточке нельзя восстановить предмет, но можно понять - тот ли это предмет.',
          realWorldExample: 'Биткоин использует SHA-256 для "майнинга". Когда вы скачиваете файл, часто показывается его SHA-256 код - если коды совпадают, файл не поврежден.',
          applications: ['Криптовалюты (биткоин)', 'Проверка целостности файлов', 'Хранение паролей', 'Блокчейн технологии'],
          advantages: ['Невозможно обратить назад', 'Одинаковый результат для одних данных', 'Малейшее изменение дает совсем другой результат'],
          disadvantages: ['Нельзя восстановить исходные данные', 'Теоретически возможны совпадения (очень редко)']
        },
        {
          name: 'SHA-3 (Keccak)',
          keySize: '224-512 бит вывод',
          security: 'Очень высокая',
          speed: 'Высокая',
          description: 'Новейший стандарт хеш-функций, основанный на алгоритме Keccak. Альтернатива SHA-2.',
          applications: ['Новые протоколы', 'Блокчейн', 'Цифровые подписи', 'Криптовалюты'],
          advantages: ['Другая математическая основа', 'Устойчивость к атакам длины расширения'],
          disadvantages: ['Меньше анализа', 'Медленнее SHA-2']
        },
        {
          name: 'BLAKE3',
          keySize: '256 бит вывод',
          security: 'Очень высокая',
          speed: 'Экстремально высокая',
          description: 'Современная криптографическая хеш-функция, оптимизированная для высокой производительности.',
          applications: ['Файловые системы', 'Контроль версий', 'Проверка целостности'],
          advantages: ['Экстремальная скорость', 'Параллелизм', 'Простота использования'],
          disadvantages: ['Относительно новая', 'Меньше стандартизации']
        },
        {
          name: 'MD5 (Message Digest 5)',
          keySize: '128 бит вывод',
          security: 'Компрометирована',
          speed: 'Очень высокая',
          description: 'Устаревшая хеш-функция, уязвимая к атакам коллизий. Не рекомендуется для криптографических целей.',
          applications: ['Проверка целостности файлов', 'Контрольные суммы'],
          advantages: ['Быстрота', 'Простота'],
          disadvantages: ['Уязвимость к коллизиям', 'Небезопасность']
        }
      ],
      modern: [
        {
          name: 'Квантовое распределение ключей',
          keySize: 'Переменный',
          security: 'Теоретически абсолютная',
          speed: 'Низкая',
          description: 'Использует квантовые свойства фотонов для безопасного распределения ключей с возможностью обнаружения подслушивания.',
          applications: ['Критически важные коммуникации', 'Банковские сети', 'Правительственные связи'],
          advantages: ['Теоретическая безопасность', 'Обнаружение подслушивания'],
          disadvantages: ['Сложность реализации', 'Ограничения расстояния']
        },
        {
          name: 'Kyber (CRYSTALS-Kyber)',
          keySize: '768-1024 бит',
          security: 'Постквантовая',
          speed: 'Высокая',
          description: 'Постквантовый алгоритм обмена ключами на основе решеток. Выбран NIST как стандарт.',
          applications: ['TLS постквантовый', 'Защищенные коммуникации', 'Правительственные системы'],
          advantages: ['NIST стандарт', 'Хорошая производительность', 'Квантовая устойчивость'],
          disadvantages: ['Большие ключи', 'Относительно новый']
        },
        {
          name: 'NTRU',
          keySize: '439-743 бит',
          security: 'Постквантовая',
          speed: 'Очень высокая',
          description: 'Один из старейших постквантовых алгоритмов, основанный на решетках в полиномиальных кольцах.',
          applications: ['Embedded системы', 'IoT устройства', 'Мобильные приложения'],
          advantages: ['Высокая скорость', 'Компактность', 'Долгая история'],
          disadvantages: ['Патентные ограничения', 'Меньше стандартизации']
        },
        {
          name: 'Постквантовая криптография',
          keySize: 'Различный',
          security: 'Устойчивость к квантовым атакам',
          speed: 'Различная',
          description: 'Алгоритмы, разработанные для защиты от атак квантовых компьютеров, включая решетчатую криптографию.',
          applications: ['Будущие стандарты', 'Долгосрочная защита', 'Критические системы'],
          advantages: ['Квантовая устойчивость', 'Подготовка к будущему'],
          disadvantages: ['Новизна', 'Большие размеры ключей/подписей']
        }
      ]
    };

    return (
      <div className="space-y-8 max-w-7xl mx-auto" data-name="crypto-info" data-file="components/CryptoInfo.jsx">
        <div className="section-header">
          <h2 className="section-title">База знаний по криптографии</h2>
          <p className="section-subtitle">
            Полное руководство по алгоритмам шифрования, их характеристикам и областям применения
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {Object.entries(cryptoCategories).map(([key, category]) => (
            <button
              key={key}
              onClick={() => {
                setSelectedCategory(key);
                setSelectedAlgorithm(null);
              }}
              className={`card-compact text-left transition-all duration-300 transform hover:scale-105 ${selectedCategory === key
                  ? 'ring-2 ring-[var(--primary-color)] bg-gradient-to-br from-[var(--primary-color)] to-[var(--accent-color)] text-white'
                  : 'hover:shadow-xl'
                }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${selectedCategory === key
                  ? 'bg-white bg-opacity-20'
                  : `bg-gradient-to-br ${category.color}`
                }`}>
                <div className={`icon-${category.icon} text-xl ${selectedCategory === key ? 'text-white' : 'text-white'
                  }`}></div>
              </div>
              <h3 className="font-bold mb-2">{category.title}</h3>
              <p className={`text-sm ${selectedCategory === key ? 'text-white text-opacity-90' : 'text-[var(--text-secondary)]'
                }`}>
                {category.description}
              </p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2">
            <div className="card">
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">
                {cryptoCategories[selectedCategory].title}
              </h3>
              <div className="grid gap-4">
                {algorithms[selectedCategory].map((algo, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedAlgorithm(algo)}
                    className={`p-4 rounded-xl border transition-all duration-300 text-left transform hover:scale-105 ${selectedAlgorithm?.name === algo.name
                        ? 'border-[var(--primary-color)] bg-[var(--primary-color)] bg-opacity-5'
                        : 'border-[var(--border-color)] hover:border-[var(--primary-color)] hover:bg-[var(--bg-tertiary)]'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-[var(--text-primary)]">{algo.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${algo.security === 'Очень высокая' ? 'bg-green-100 text-green-700' :
                          algo.security === 'Высокая' ? 'bg-blue-100 text-blue-700' :
                            algo.security === 'Средняя' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                        }`}>
                        {algo.security}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mb-2">{algo.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-[var(--text-muted)]">
                      <span>Ключ: {algo.keySize}</span>
                      <span>Скорость: {algo.speed}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {selectedAlgorithm ? (
              <>
                <div className="card-compact">
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">
                    {selectedAlgorithm.name}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-[var(--text-secondary)]">Размер ключа:</span>
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{selectedAlgorithm.keySize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-[var(--text-secondary)]">Безопасность:</span>
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{selectedAlgorithm.security}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-[var(--text-secondary)]">Скорость:</span>
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{selectedAlgorithm.speed}</span>
                    </div>
                  </div>
                </div>

                <div className="card-compact">
                  <h4 className="font-semibold text-[var(--text-primary)] mb-3">Применение</h4>
                  <div className="space-y-2">
                    {selectedAlgorithm.applications.map((app, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-[var(--accent-color)] rounded-full"></div>
                        <span className="text-sm text-[var(--text-secondary)]">{app}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-compact">
                  <h4 className="font-semibold text-[var(--text-primary)] mb-3">Преимущества</h4>
                  <div className="space-y-2">
                    {selectedAlgorithm.advantages.map((adv, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="icon-check text-green-600 text-sm"></div>
                        <span className="text-sm text-[var(--text-secondary)]">{adv}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-compact">
                  <h4 className="font-semibold text-[var(--text-primary)] mb-3">Недостатки</h4>
                  <div className="space-y-2">
                    {selectedAlgorithm.disadvantages.map((dis, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="icon-x text-red-600 text-sm"></div>
                        <span className="text-sm text-[var(--text-secondary)]">{dis}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="card-compact text-center py-8">
                <div className="w-16 h-16 bg-[var(--bg-tertiary)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <div className="icon-info text-2xl text-[var(--text-secondary)]"></div>
                </div>
                <p className="text-[var(--text-secondary)]">
                  Выберите алгоритм для просмотра подробной информации
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('CryptoInfo component error:', error);
    return null;
  }
}

export default CryptoInfo