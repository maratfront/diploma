import React from 'react'
import {
	generateECCKeyPair,
	signECC,
	verifyECC,
	encryptECC,
	decryptECC
} from '../utils/cryptoUtils.js'
import { addToHistory } from '../utils/storage.js'
import { NotificationManager } from './Notification.jsx'
import CopyButton from './common/CopyButton.jsx'

function ECCPanel() {
	try {
		const [operation, setOperation] = React.useState('generate');
		const [message, setMessage] = React.useState('');
		const [encryptedData, setEncryptedData] = React.useState('');
		const [privateKey, setPrivateKey] = React.useState('');
		const [publicKey, setPublicKey] = React.useState('');
		const [signature, setSignature] = React.useState('');
		const [isProcessing, setIsProcessing] = React.useState(false);
		const [curve, setCurve] = React.useState('P-256');
		const [hashAlgorithm, setHashAlgorithm] = React.useState('SHA256');

		// Результаты операций
		const [generatedKeyPair, setGeneratedKeyPair] = React.useState(null);
		const [generatedSignature, setGeneratedSignature] = React.useState('');
		const [verificationResult, setVerificationResult] = React.useState(null);
		const [encryptedResult, setEncryptedResult] = React.useState(null);
		const [decryptedResult, setDecryptedResult] = React.useState('');

		// Функция для декодирования Base64 в PEM
		const decodeBase64ToPEM = (base64Str) => {
			try {
				const decoded = atob(base64Str);
				return decoded;
			} catch (error) {
				console.error('Error decoding Base64:', error);
				return base64Str;
			}
		};

		// Функция для форматирования PEM ключа
		const formatPEMKey = (pem) => {
			if (!pem) return '';
			if (pem.includes('-----BEGIN')) return pem; // Уже в PEM формате
			return pem; // Если не PEM, возвращаем как есть
		};

		const generateKeys = async () => {
			setIsProcessing(true);
			try {
				const result = await generateECCKeyPair(curve);

				// Декодируем Base64 в читаемый PEM формат
				const publicKeyPEM = decodeBase64ToPEM(result.public_key);
				const privateKeyPEM = decodeBase64ToPEM(result.private_key);

				setGeneratedKeyPair({
					public_key: result.public_key, // Оригинальный Base64
					private_key: result.private_key, // Оригинальный Base64
					public_key_pem: publicKeyPEM, // Декодированный PEM
					private_key_pem: privateKeyPEM, // Декодированный PEM
					curve: result.curve
				});

				// Автоматически заполняем поля для использования
				setPublicKey(result.public_key);
				setPrivateKey(result.private_key);

				NotificationManager.success('Ключевая пара ECC успешно сгенерирована!');
			} catch (error) {
				console.error('ECC key generation error:', error);
				NotificationManager.error('Ошибка генерации ключей: ' + error.message);
			} finally {
				setIsProcessing(false);
			}
		};

		const handleSign = async () => {
			if (!message.trim()) {
				NotificationManager.warning('Введите сообщение для подписи');
				return;
			}
			if (!privateKey.trim()) {
				NotificationManager.error('Введите приватный ключ');
				return;
			}

			setIsProcessing(true);
			try {
				const result = await signECC(message, privateKey, hashAlgorithm);
				setGeneratedSignature(result.signature);

				await addToHistory({
					type: 'sign',
					algorithm: 'ECC-' + curve,
					input: `Сообщение: ${message.substring(0, 50)}...`,
					output: `Подпись: ${result.signature.substring(0, 50)}...`,
					timestamp: Date.now()
				});

				NotificationManager.success('Сообщение успешно подписано!');
			} catch (error) {
				console.error('ECC signing error:', error);
				NotificationManager.error('Ошибка подписи: ' + error.message);
			} finally {
				setIsProcessing(false);
			}
		};

		const handleVerify = async () => {
			if (!message.trim() || !signature.trim() || !publicKey.trim()) {
				NotificationManager.warning('Заполните все поля для верификации');
				return;
			}

			setIsProcessing(true);
			try {
				const result = await verifyECC(message, signature, publicKey, hashAlgorithm);
				setVerificationResult(result.is_valid);

				await addToHistory({
					type: 'verify',
					algorithm: 'ECC-' + curve,
					input: `Сообщение: ${message.substring(0, 50)}...`,
					output: result.is_valid ? 'Подпись верна' : 'Подпись неверна',
					timestamp: Date.now()
				});

				if (result.is_valid) {
					NotificationManager.success('Подпись верифицирована успешно!');
				} else {
					NotificationManager.error('Подпись недействительна!');
				}
			} catch (error) {
				console.error('ECC verification error:', error);
				setVerificationResult(false);
				NotificationManager.error('Ошибка верификации: ' + error.message);
			} finally {
				setIsProcessing(false);
			}
		};

		const handleEncrypt = async () => {
			if (!message.trim()) {
				NotificationManager.warning('Введите сообщение для шифрования');
				return;
			}
			if (!publicKey.trim()) {
				NotificationManager.error('Введите публичный ключ');
				return;
			}

			setIsProcessing(true);
			try {
				const result = await encryptECC(message, publicKey);

				// Парсим JSON строку в объект
				let parsedEncrypted;
				try {
					parsedEncrypted = JSON.parse(result.encrypted);
				} catch (e) {
					parsedEncrypted = result.encrypted;
				}

				setEncryptedResult(parsedEncrypted);

				NotificationManager.success('Сообщение успешно зашифровано!');
			} catch (error) {
				console.error('ECC encryption error:', error);
				NotificationManager.error('Ошибка шифрования: ' + error.message);
			} finally {
				setIsProcessing(false);
			}
		};

		const handleDecrypt = async () => {
			if (!encryptedData.trim()) {
				NotificationManager.warning('Введите зашифрованные данные');
				return;
			}
			if (!privateKey.trim()) {
				NotificationManager.error('Введите приватный ключ');
				return;
			}

			setIsProcessing(true);
			try {
				// Пробуем распарсить JSON, если это необходимо
				let dataToDecrypt = encryptedData;
				try {
					const parsed = JSON.parse(encryptedData);
					if (typeof parsed === 'object') {
						dataToDecrypt = JSON.stringify(parsed);
					}
				} catch (e) {
					// Если не JSON, используем как есть
				}

				const result = await decryptECC(dataToDecrypt, privateKey);
				setDecryptedResult(result.decrypted);

				NotificationManager.success('Сообщение успешно расшифровано!');
			} catch (error) {
				console.error('ECC decryption error:', error);
				NotificationManager.error('Ошибка расшифрования: ' + error.message);
			} finally {
				setIsProcessing(false);
			}
		};

		const clearFields = () => {
			setMessage('');
			setEncryptedData('');
			setPrivateKey('');
			setPublicKey('');
			setSignature('');
			setGeneratedKeyPair(null);
			setGeneratedSignature('');
			setVerificationResult(null);
			setEncryptedResult(null);
			setDecryptedResult('');
		};

		// Функция для форматированного отображения JSON
		const formatJSON = (obj) => {
			if (!obj) return '';
			if (typeof obj === 'string') {
				try {
					return JSON.stringify(JSON.parse(obj), null, 2);
				} catch {
					return obj;
				}
			}
			return JSON.stringify(obj, null, 2);
		};

		return (
			<div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto" data-name="ecc-panel">
				<div className="section-header">
					<h2 className="section-title text-2xl sm:text-3xl lg:text-4xl">Криптография на эллиптических кривых (ECC)</h2>
					<p className="section-subtitle text-base sm:text-lg">
						Высокоэффективная асимметричная криптография с малыми размерами ключей
					</p>
				</div>

				<div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
					<div className="card p-4 sm:p-6 lg:p-8">
						<div className="flex items-center space-x-3 mb-4 sm:mb-6">
							<div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--primary-color)] rounded-xl flex items-center justify-center">
								<div className="icon-key text-lg sm:text-xl text-white"></div>
							</div>
							<h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">Настройки ECC</h3>
						</div>

						<div className="space-y-6">
							<div>
								<label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">Операция</label>
								<select
									value={operation}
									onChange={(e) => {
										setOperation(e.target.value);
										// Очищаем предыдущие результаты при смене операции
										setGeneratedKeyPair(null);
										setGeneratedSignature('');
										setVerificationResult(null);
										setEncryptedResult(null);
										setDecryptedResult('');
									}}
									className="input-field"
								>
									<option value="generate">Генерация ключей</option>
									<option value="sign">Цифровая подпись</option>
									<option value="verify">Проверка подписи</option>
									<option value="encrypt">Шифрование</option>
									<option value="decrypt">Расшифрование</option>
								</select>
							</div>

							{operation !== 'decrypt' && (
								<div>
									<label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">Кривая</label>
									<select
										value={curve}
										onChange={(e) => setCurve(e.target.value)}
										className="input-field"
									>
										<option value="P-256">P-256 (secp256r1) - Наиболее распространенная</option>
										<option value="P-384">P-384 (secp384r1) - Высокая безопасность</option>
										<option value="P-521">P-521 (secp521r1) - Максимальная безопасность</option>
									</select>
								</div>
							)}

							{(operation === 'sign' || operation === 'verify') && (
								<div>
									<label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">Хэш-алгоритм</label>
									<select
										value={hashAlgorithm}
										onChange={(e) => setHashAlgorithm(e.target.value)}
										className="input-field"
									>
										<option value="SHA256">SHA-256</option>
										<option value="SHA512">SHA-512</option>
									</select>
								</div>
							)}

							<button onClick={clearFields} className="btn-secondary w-full">
								<div className="icon-refresh-cw text-lg mr-2"></div>
								Очистить все поля
							</button>

							{/* Отображение сгенерированных ключей */}
							{operation === 'generate' && generatedKeyPair && (
								<div className="mt-4 p-4 bg-[var(--bg-tertiary)] rounded-xl">
									<h4 className="font-semibold text-[var(--text-primary)] mb-2">Сгенерированные ключи</h4>
									<p className="text-xs text-[var(--text-secondary)] mb-2">Кривая: {generatedKeyPair.curve}</p>
									<div className="space-y-2">
										<div>
											<p className="text-xs font-semibold text-[var(--text-secondary)]">Публичный ключ (Base64):</p>
											<p className="text-xs font-mono break-all">{generatedKeyPair.public_key.substring(0, 80)}...</p>
										</div>
										<div>
											<p className="text-xs font-semibold text-[var(--text-secondary)]">Приватный ключ (Base64):</p>
											<p className="text-xs font-mono break-all">{generatedKeyPair.private_key.substring(0, 80)}...</p>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>

					<div className="xl:col-span-2">
						<div className="card p-4 sm:p-6 lg:p-8">
							<div className="flex items-center space-x-3 mb-4 sm:mb-6">
								<div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--accent-color)] rounded-xl flex items-center justify-center">
									<div className="icon-terminal text-lg sm:text-xl text-white"></div>
								</div>
								<h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
									{operation === 'generate' ? 'Генерация ключей ECC' :
										operation === 'sign' ? 'Создание цифровой подписи' :
											operation === 'verify' ? 'Проверка цифровой подписи' :
												operation === 'encrypt' ? 'Шифрование сообщения' : 'Расшифрование сообщения'}
								</h3>
							</div>

							<div className="space-y-6">
								{/* Поля ввода в зависимости от операции */}

								{operation === 'generate' ? (
									<div>
										<button
											onClick={generateKeys}
											disabled={isProcessing}
											className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
										>
											{isProcessing ? (
												<>
													<div className="icon-loader-2 text-lg mr-2 animate-spin"></div>
													Генерация ключей...
												</>
											) : (
												<>
													<div className="icon-key text-lg mr-2"></div>
													Сгенерировать ключевую пару
												</>
											)}
										</button>
									</div>
								) : null}

								{operation === 'sign' && (
									<>
										<div>
											<label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
												Приватный ключ (Base64)
											</label>
											<textarea
												value={privateKey}
												onChange={(e) => setPrivateKey(e.target.value)}
												className="input-field h-24 resize-none font-mono text-sm"
												placeholder="Введите приватный ключ в формате Base64..."
											/>
										</div>
										<div>
											<label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
												Сообщение для подписи
											</label>
											<textarea
												value={message}
												onChange={(e) => setMessage(e.target.value)}
												className="input-field h-32 resize-none"
												placeholder="Введите сообщение для подписи..."
											/>
										</div>
										<button
											onClick={handleSign}
											disabled={isProcessing || !privateKey.trim() || !message.trim()}
											className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
										>
											{isProcessing ? (
												<>
													<div className="icon-loader-2 text-lg mr-2 animate-spin"></div>
													Создание подписи...
												</>
											) : (
												<>
													<div className="icon-pen-tool text-lg mr-2"></div>
													Подписать сообщение
												</>
											)}
										</button>
									</>
								)}

								{operation === 'verify' && (
									<>
										<div>
											<label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
												Публичный ключ (Base64)
											</label>
											<textarea
												value={publicKey}
												onChange={(e) => setPublicKey(e.target.value)}
												className="input-field h-24 resize-none font-mono text-sm"
												placeholder="Введите публичный ключ в формате Base64..."
											/>
										</div>
										<div>
											<label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
												Сообщение для проверки
											</label>
											<textarea
												value={message}
												onChange={(e) => setMessage(e.target.value)}
												className="input-field h-24 resize-none"
												placeholder="Введите сообщение для проверки..."
											/>
										</div>
										<div>
											<label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
												Подпись (Base64)
											</label>
											<textarea
												value={signature}
												onChange={(e) => setSignature(e.target.value)}
												className="input-field h-24 resize-none font-mono text-sm"
												placeholder="Введите подпись в формате Base64..."
											/>
										</div>
										<button
											onClick={handleVerify}
											disabled={isProcessing || !publicKey.trim() || !message.trim() || !signature.trim()}
											className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
										>
											{isProcessing ? (
												<>
													<div className="icon-loader-2 text-lg mr-2 animate-spin"></div>
													Проверка подписи...
												</>
											) : (
												<>
													<div className="icon-check-circle text-lg mr-2"></div>
													Проверить подпись
												</>
											)}
										</button>
									</>
								)}

								{operation === 'encrypt' && (
									<>
										<div>
											<label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
												Публичный ключ получателя (Base64)
											</label>
											<textarea
												value={publicKey}
												onChange={(e) => setPublicKey(e.target.value)}
												className="input-field h-24 resize-none font-mono text-sm"
												placeholder="Введите публичный ключ в формате Base64..."
											/>
										</div>
										<div>
											<label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
												Сообщение для шифрования
											</label>
											<textarea
												value={message}
												onChange={(e) => setMessage(e.target.value)}
												className="input-field h-32 resize-none"
												placeholder="Введите сообщение для шифрования..."
											/>
										</div>
										<button
											onClick={handleEncrypt}
											disabled={isProcessing || !publicKey.trim() || !message.trim()}
											className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
										>
											{isProcessing ? (
												<>
													<div className="icon-loader-2 text-lg mr-2 animate-spin"></div>
													Шифрование...
												</>
											) : (
												<>
													<div className="icon-lock text-lg mr-2"></div>
													Зашифровать сообщение
												</>
											)}
										</button>
									</>
								)}

								{operation === 'decrypt' && (
									<>
										<div>
											<label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
												Приватный ключ (Base64)
											</label>
											<textarea
												value={privateKey}
												onChange={(e) => setPrivateKey(e.target.value)}
												className="input-field h-32 resize-none font-mono text-sm"
												placeholder="Введите приватный ключ в формате Base64..."
											/>
										</div>
										<div>
											<label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
												Зашифрованные данные (JSON)
											</label>
											<textarea
												value={encryptedData}
												onChange={(e) => setEncryptedData(e.target.value)}
												className="input-field h-32 resize-none font-mono text-sm"
												placeholder='Введите зашифрованные данные в формате JSON: {"ephemeral_pubkey": "...", "nonce": "...", "tag": "...", "ciphertext": "..."}'
											/>
										</div>
										<button
											onClick={handleDecrypt}
											disabled={isProcessing || !privateKey.trim() || !encryptedData.trim()}
											className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
										>
											{isProcessing ? (
												<>
													<div className="icon-loader-2 text-lg mr-2 animate-spin"></div>
													Расшифрование...
												</>
											) : (
												<>
													<div className="icon-lock-open text-lg mr-2"></div>
													Расшифровать сообщение
												</>
											)}
										</button>
									</>
								)}

								{/* Отображение результатов */}

								{operation === 'sign' && generatedSignature && (
									<div className="mt-6 p-4 bg-[var(--bg-tertiary)] rounded-xl">
										<div className="flex items-center justify-between mb-3">
											<label className="block text-sm font-semibold text-[var(--text-primary)]">
												Цифровая подпись (Base64)
											</label>
											<CopyButton text={generatedSignature} />
										</div>
										<textarea
											value={generatedSignature}
											readOnly
											className="input-field h-24 resize-none bg-[var(--bg-primary)] font-mono text-sm"
											placeholder="Здесь появится цифровая подпись..."
										/>
										<p className="text-xs text-[var(--text-secondary)] mt-2">
											Длина подписи: {generatedSignature.length} символов
										</p>
									</div>
								)}

								{operation === 'verify' && verificationResult !== null && (
									<div className={`mt-6 p-4 rounded-xl border ${verificationResult
										? 'bg-green-50 border-green-300 text-green-700'
										: 'bg-red-50 border-red-300 text-red-700'
										}`}>
										<div className="flex items-center space-x-3">
											<div className={`icon-${verificationResult ? 'check-circle' : 'x-circle'} text-xl`}></div>
											<div>
												<p className="font-semibold">
													{verificationResult ? 'Подпись верифицирована успешно!' : 'Подпись недействительна!'}
												</p>
												<p className="text-sm">
													{verificationResult
														? 'Сообщение не было изменено после подписания.'
														: 'Сообщение было изменено или подпись некорректна.'}
												</p>
											</div>
										</div>
									</div>
								)}

								{operation === 'encrypt' && encryptedResult && (
									<div className="mt-6 p-4 bg-[var(--bg-primary)] rounded-xl">
										<div className="flex items-center justify-between mb-3">
											<label className="block text-sm font-semibold text-[var(--text-primary)]">
												Зашифрованные данные
											</label>
											<CopyButton text={JSON.stringify(encryptedResult)} />
										</div>
										<textarea
											value={formatJSON(encryptedResult)}
											readOnly
											className="input-field h-48 resize-none bg-[var(--bg-tertiary)] font-mono text-xs"
											placeholder="Здесь появятся зашифрованные данные..."
										/>
										<p className="text-xs text-[var(--text-secondary)] mt-2">
											Формат: ECDH + AES-GCM
										</p>
									</div>
								)}

								{operation === 'decrypt' && decryptedResult && (
									<div className="mt-6 p-4 bg-[var(--bg-primary)] rounded-xl">
										<div className="flex items-center justify-between mb-3">
											<label className="block text-sm font-semibold text-[var(--text-primary)]">
												Расшифрованное сообщение
											</label>
											<CopyButton text={decryptedResult} />
										</div>
										<textarea
											value={decryptedResult}
											readOnly
											className="input-field h-32 resize-none bg-[var(--bg-tertiary)]"
											placeholder="Здесь появится расшифрованное сообщение..."
										/>
										<p className="text-xs text-[var(--text-secondary)] mt-2">
											Длина сообщения: {decryptedResult.length} символов
										</p>
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
						<h3 className="text-lg font-bold text-[var(--text-primary)]">Как работает ECC шифрование</h3>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="bg-[var(--bg-secondary)] p-4 rounded-xl">
							<h4 className="font-semibold text-[var(--text-primary)] mb-2 flex items-center">
								<div className="icon-key text-lg mr-2 text-yellow-500"></div>
								Генерация ключей
							</h4>
							<p className="text-sm text-[var(--text-secondary)]">
								На основе выбранной эллиптической кривой генерируется пара ключей: приватный (для подписи/расшифрования) и публичный (для проверки/шифрования).
							</p>
						</div>
						<div className="bg-[var(--bg-secondary)] p-4 rounded-xl">
							<h4 className="font-semibold text-[var(--text-primary)] mb-2 flex items-center">
								<div className="icon-lock text-lg mr-2 text-green-500"></div>
								Шифрование (ECDH + AES-GCM)
							</h4>
							<p className="text-sm text-[var(--text-secondary)]">
								Генерируется временный ключ, вычисляется общий секрет ECDH, который используется как ключ AES для шифрования сообщения.
							</p>
						</div>
						<div className="bg-[var(--bg-secondary)] p-4 rounded-xl">
							<h4 className="font-semibold text-[var(--text-primary)] mb-2 flex items-center">
								<div className="icon-shield-check text-lg mr-2 text-blue-500"></div>
								Цифровые подписи (ECDSA)
							</h4>
							<p className="text-sm text-[var(--text-secondary)]">
								Подпись создается с использованием приватного ключа и проверяется с помощью публичного ключа, обеспечивая аутентичность и целостность.
							</p>
						</div>
					</div>
				</div>
			</div>
		);
	} catch (error) {
		console.error('ECCPanel component error:', error);
		return null;
	}
}

export default ECCPanel;
