import React from 'react'
import { hashData, verifyHash } from '../utils/cryptoUtils.js'
import { addToHistory } from '../utils/storage.js'
import { NotificationManager } from './Notification.jsx'
import CopyButton from './common/CopyButton.jsx'

function HashingPanel() {
	try {
		const [inputText, setInputText] = React.useState('');
		const [outputHash, setOutputHash] = React.useState('');
		const [algorithm, setAlgorithm] = React.useState('sha256');
		const [isProcessing, setIsProcessing] = React.useState(false);
		const [mode, setMode] = React.useState('generate'); // 'generate' или 'verify'
		const [hashToVerify, setHashToVerify] = React.useState('');
		const [verificationResult, setVerificationResult] = React.useState(null);
		const [argon2Params, setArgon2Params] = React.useState({
			time_cost: 2,
			memory_cost: 512,
			parallelism: 2,
			hash_len: 32
		});

		const handleHash = async () => {
			if (!inputText.trim()) {
				NotificationManager.warning('Введите текст для хэширования');
				return;
			}

			setIsProcessing(true);
			setVerificationResult(null);
			setHashToVerify(''); // Очищаем поле проверки

			try {
				let result;

				if (algorithm === 'sha256') {
					result = await hashData(inputText, algorithm);
					setOutputHash(result.hash);
				} else if (algorithm === 'argon2') {
					result = await hashData(inputText, algorithm, argon2Params);
					setOutputHash(result.hash);
				}

				await addToHistory({
					type: 'hash',
					algorithm: algorithm.toUpperCase(),
					input: inputText.substring(0, 100) + (inputText.length > 100 ? '...' : ''),
					output: result.hash.substring(0, 50) + '...',
					timestamp: Date.now()
				});

				NotificationManager.success('Хэширование выполнено успешно!');
			} catch (error) {
				console.error('Hashing error:', error);
				setOutputHash('');
				NotificationManager.error('Ошибка хэширования: ' + error.message);
			} finally {
				setIsProcessing(false);
			}
		};

		const handleVerify = async () => {
			if (!inputText.trim()) {
				NotificationManager.warning('Введите текст для проверки');
				return;
			}

			if (!hashToVerify.trim()) {
				NotificationManager.warning('Введите хэш для проверки');
				return;
			}

			setIsProcessing(true);

			try {
				const result = await verifyHash(inputText, hashToVerify, algorithm);

				setVerificationResult(result.is_valid);

				await addToHistory({
					type: 'verify',
					algorithm: algorithm.toUpperCase(),
					input: `Текст: ${inputText.substring(0, 50)}...`,
					output: result.is_valid ? 'Хэш верен' : 'Хэш не совпадает',
					timestamp: Date.now()
				});

				// Показываем всплывающее уведомление
				if (result.is_valid) {
					NotificationManager.success('Хэш верифицирован успешно!');
				} else {
					NotificationManager.error('Хэш не совпадает!');
				}
			} catch (error) {
				console.error('Verification error:', error);
				setVerificationResult(false);
				NotificationManager.error('Ошибка верификации: ' + error.message);
			} finally {
				setIsProcessing(false);
			}
		};

		const clearFields = () => {
			setInputText('');
			setOutputHash('');
			setHashToVerify('');
			setVerificationResult(null);
		};

		const copyGeneratedHash = () => {
			if (outputHash) {
				setHashToVerify(outputHash);
				setMode('verify');
				NotificationManager.info('Хэш скопирован в поле для проверки');
			}
		};

		return (
			<div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto" data-name="hashing-panel">
				<div className="section-header">
					<h2 className="section-title text-2xl sm:text-3xl lg:text-4xl">Хэширование данных</h2>
					<p className="section-subtitle text-base sm:text-lg">
						Криптографическое хэширование и проверка целостности данных
					</p>
				</div>

				<div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
					<div className="card p-4 sm:p-6 lg:p-8">
						<div className="flex items-center space-x-3 mb-4 sm:mb-6">
							<div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--primary-color)] rounded-xl flex items-center justify-center">
								<div className="icon-hash text-lg sm:text-xl text-white"></div>
							</div>
							<h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">Настройки</h3>
						</div>

						<div className="space-y-6">
							<div>
								<label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">Режим работы</label>
								<div className="grid grid-cols-2 gap-2">
									{['generate', 'verify'].map(m => (
										<button
											key={m}
											onClick={() => {
												setMode(m);
												setVerificationResult(null);
											}}
											className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-medium text-sm sm:text-base transition-all ${mode === m
												? 'bg-[var(--primary-color)] text-white shadow-lg'
												: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
												}`}
										>
											{m === 'generate' ? 'Генерация' : 'Проверка'}
										</button>
									))}
								</div>
							</div>

							<div>
								<label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">Алгоритм хэширования</label>
								<select
									value={algorithm}
									onChange={(e) => {
										setAlgorithm(e.target.value);
										setOutputHash('');
										setHashToVerify('');
										setVerificationResult(null);
									}}
									className="input-field"
								>
									<option value="sha256">SHA-256 (Быстрый, для целостности данных)</option>
									<option value="argon2">Argon2 (Для паролей, защита от перебора)</option>
								</select>

								<div className="mt-3 p-3 bg-[var(--bg-tertiary)] rounded-xl">
									<p className="text-sm font-medium text-[var(--text-primary)]">
										{algorithm === 'sha256' ? 'SHA-256' : 'Argon2id'}
									</p>
									<p className="text-xs text-[var(--text-secondary)]">
										{algorithm === 'sha256'
											? '256-битный криптографический хэш, используется в блокчейне и для проверки целостности'
											: 'Победитель Password Hashing Competition 2015, устойчив к GPU и ASIC атакам'}
									</p>
								</div>
							</div>

							{algorithm === 'argon2' && (
								<div className="space-y-4">
									<h4 className="text-sm font-semibold text-[var(--text-primary)]">Параметры Argon2</h4>

									<div>
										<label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
											Время (time cost): {argon2Params.time_cost}
										</label>
										<input
											type="range"
											min="1"
											max="10"
											value={argon2Params.time_cost}
											onChange={(e) => setArgon2Params({ ...argon2Params, time_cost: parseInt(e.target.value) })}
											className="w-full"
										/>
									</div>

									<div>
										<label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
											Память (memory cost): {argon2Params.memory_cost} KB
										</label>
										<input
											type="range"
											min="64"
											max="4096"
											step="64"
											value={argon2Params.memory_cost}
											onChange={(e) => setArgon2Params({ ...argon2Params, memory_cost: parseInt(e.target.value) })}
											className="w-full"
										/>
									</div>

									<div>
										<label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
											Параллелизм (parallelism): {argon2Params.parallelism}
										</label>
										<input
											type="range"
											min="1"
											max="8"
											value={argon2Params.parallelism}
											onChange={(e) => setArgon2Params({ ...argon2Params, parallelism: parseInt(e.target.value) })}
											className="w-full"
										/>
									</div>
								</div>
							)}

							<button onClick={clearFields} className="btn-secondary w-full">
								<div className="icon-refresh-cw text-lg mr-2"></div>
								Очистить все поля
							</button>
						</div>
					</div>

					<div className="xl:col-span-2">
						<div className="card p-4 sm:p-6 lg:p-8">
							<div className="flex items-center space-x-3 mb-4 sm:mb-6">
								<div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--accent-color)] rounded-xl flex items-center justify-center">
									<div className="icon-terminal text-lg sm:text-xl text-white"></div>
								</div>
								<h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
									{mode === 'generate' ? 'Генерация хэша' : 'Проверка хэша'}
								</h3>
							</div>

							<div className="space-y-6">
								<div>
									<label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
										{mode === 'generate' ? 'Текст для хэширования' : 'Текст для проверки'}
									</label>
									<textarea
										value={inputText}
										onChange={(e) => setInputText(e.target.value)}
										className="input-field h-32 resize-none"
										placeholder={mode === 'generate' ? "Введите текст для хэширования..." : "Введите текст для проверки..."}
									/>
									<p className="text-xs text-[var(--text-secondary)] mt-2">
										Символов: {inputText.length}
									</p>
								</div>

								{mode === 'verify' && (
									<div>
										<label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
											Хэш для проверки
										</label>
										<textarea
											value={hashToVerify}
											onChange={(e) => setHashToVerify(e.target.value)}
											className="input-field h-24 resize-none font-mono text-sm"
											placeholder="Вставьте хэш для проверки..."
										/>
									</div>
								)}

								<div className="flex space-x-3">
									<button
										onClick={mode === 'generate' ? handleHash : handleVerify}
										disabled={!inputText.trim() || isProcessing || (mode === 'verify' && !hashToVerify.trim())}
										className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{isProcessing ? (
											<>
												<div className="icon-loader-2 text-lg mr-2 animate-spin"></div>
												Обработка...
											</>
										) : (
											<>
												<div className={`icon-${mode === 'generate' ? 'hash' : 'check-circle'} text-lg mr-2`}></div>
												{mode === 'generate' ? 'Вычислить хэш' : 'Проверить хэш'}
											</>
										)}
									</button>

									{mode === 'generate' && outputHash && (
										<button
											onClick={copyGeneratedHash}
											className="btn-secondary"
											title="Проверить этот хэш"
										>
											<div className="icon-check-circle text-lg mr-2"></div>
											Проверить
										</button>
									)}
								</div>

								{/* Блок с результатом генерации */}
								{mode === 'generate' && outputHash && (
									<div className="p-4 bg-[var(--bg-primary)] rounded-xl">
										<div className="flex items-center justify-between mb-3">
											<label className="block text-sm font-semibold text-[var(--text-primary)]">
												Сгенерированный хэш
											</label>
											<CopyButton text={outputHash} />
										</div>
										<textarea
											value={outputHash}
											readOnly
											className="input-field h-32 resize-none bg-[var(--bg-tertiary)] font-mono text-sm"
											placeholder="Здесь появится результат хэширования..."
										/>
										<div className="mt-2 flex items-center space-x-2 text-xs text-[var(--text-secondary)]">
											<div className="w-2 h-2 bg-green-500 rounded-full"></div>
											<span>Длина хэша: {outputHash.length} символов</span>
										</div>
									</div>
								)}

								{/* Блок с результатом проверки */}
								{mode === 'verify' && verificationResult !== null && (
									<div className={`p-4 rounded-xl border ${verificationResult
										? 'bg-green-50 border-green-300 text-green-700'
										: 'bg-red-50 border-red-300 text-red-700'
										}`}>
										<div className="flex items-center space-x-3">
											<div className={`icon-${verificationResult ? 'check-circle' : 'x-circle'} text-xl`}></div>
											<div>
												<p className="font-semibold">
													{verificationResult ? 'Хэш верифицирован успешно!' : 'Хэш не совпадает!'}
												</p>
												<p className="text-sm">
													{verificationResult
														? `Текст соответствует предоставленному хэшу ${algorithm.toUpperCase()}.`
														: `Текст не соответствует предоставленному хэшу ${algorithm.toUpperCase()}.`}
												</p>
											</div>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				<div className="card p-6">
					<div className="flex items-center space-x-3 mb-4">
						<div className="w-10 h-10 bg-[var(--bg-tertiary)] rounded-xl flex items-center justify-center">
							<div className="icon-info text-lg text-[var(--text-primary)]"></div>
						</div>
						<h3 className="text-lg font-bold text-[var(--text-primary)]">О алгоритмах хэширования</h3>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="bg-[var(--bg-secondary)] p-4 rounded-xl">
							<h4 className="font-semibold text-[var(--text-primary)] mb-2 flex items-center">
								<div className="icon-shield text-lg mr-2 text-green-500"></div>
								SHA-256
							</h4>
							<p className="text-sm text-[var(--text-secondary)] mb-2">
								Используется в Bitcoin, SSL/TLS, Git. Обеспечивает целостность данных.
							</p>
							<ul className="text-xs text-[var(--text-secondary)] space-y-1">
								<li>• Размер хэша: 256 бит (64 hex символа)</li>
								<li>• Скорость: Очень высокая</li>
								<li>• Проверка: Сравнение вычисленного хэша с сохраненным</li>
								<li>• Использование: Проверка целостности файлов, цифровые подписи</li>
							</ul>
						</div>
						<div className="bg-[var(--bg-secondary)] p-4 rounded-xl">
							<h4 className="font-semibold text-[var(--text-primary)] mb-2 flex items-center">
								<div className="icon-lock text-lg mr-2 text-blue-500"></div>
								Argon2
							</h4>
							<p className="text-sm text-[var(--text-secondary)] mb-2">
								Рекомендуется для хэширования паролей. Защищен от атак с использованием GPU и ASIC.
							</p>
							<ul className="text-xs text-[var(--text-secondary)] space-y-1">
								<li>• Победитель Password Hashing Competition 2015</li>
								<li>• Настраиваемые параметры безопасности</li>
								<li>• Проверка: Специальная функция верификации с учетом параметров</li>
								<li>• Использование: Хранение паролей, ключей шифрования</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		);
	} catch (error) {
		console.error('HashingPanel component error:', error);
		return null;
	}
}

export default HashingPanel;
