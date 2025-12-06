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
		const [operation, setOperation] = React.useState('sign');
		const [message, setMessage] = React.useState('');
		const [encryptedData, setEncryptedData] = React.useState('');
		const [signature, setSignature] = React.useState('');
		const [isProcessing, setIsProcessing] = React.useState(false);
		const [curve, setCurve] = React.useState('P-256');
		const [hashAlgorithm, setHashAlgorithm] = React.useState('SHA256');

		// Хранилище для сохранения данных при переключении операций
		const [operationData, setOperationData] = React.useState({
			signVerify: {
				message: '',
				signature: '',
				generatedSignature: ''
			},
			encryptDecrypt: {
				message: '',
				encryptedData: '',
				encryptedResult: null,
				decryptedResult: ''
			}
		});

		// Ключи теперь генерируются автоматически
		const [keyPair, setKeyPair] = React.useState(null);
		const [generatedSignature, setGeneratedSignature] = React.useState('');
		const [verificationResult, setVerificationResult] = React.useState(null);
		const [encryptedResult, setEncryptedResult] = React.useState(null);
		const [decryptedResult, setDecryptedResult] = React.useState('');

		// Автоматическая генерация ключей при монтировании
		React.useEffect(() => {
			generateNewKeyPair();
		}, [curve]);

		// Сохранение данных при переключении операций
		React.useEffect(() => {
			if (operation === 'sign' || operation === 'verify') {
				// При переключении на sign/verify, восстанавливаем сохраненные данные
				const savedData = operationData.signVerify;
				setMessage(savedData.message);
				setSignature(savedData.signature);
				if (operation === 'verify' && savedData.generatedSignature && !savedData.signature) {
					// Если есть сгенерированная подпись, но поле подписи пустое, заполняем его
					setSignature(savedData.generatedSignature);
				}
			} else {
				// При переключении на encrypt/decrypt, восстанавливаем сохраненные данные
				const savedData = operationData.encryptDecrypt;
				setMessage(savedData.message);
				setEncryptedData(savedData.encryptedData);
				setEncryptedResult(savedData.encryptedResult);
				setDecryptedResult(savedData.decryptedResult);
			}
		}, [operation]);

		const decodeBase64ToPEM = (base64Str) => {
			try {
				const decoded = atob(base64Str);
				return decoded;
			} catch (error) {
				console.error('Error decoding Base64:', error);
				return base64Str;
			}
		};

		const generateNewKeyPair = async () => {
			setIsProcessing(true);
			try {
				const result = await generateECCKeyPair(curve);

				const publicKeyPEM = decodeBase64ToPEM(result.public_key);
				const privateKeyPEM = decodeBase64ToPEM(result.private_key);

				setKeyPair({
					public_key: result.public_key,
					private_key: result.private_key,
					public_key_pem: publicKeyPEM,
					private_key_pem: privateKeyPEM,
					curve: result.curve
				});

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
			if (!keyPair?.private_key) {
				NotificationManager.error('Приватный ключ не сгенерирован');
				return;
			}

			setIsProcessing(true);
			try {
				const result = await signECC(message, keyPair.private_key, hashAlgorithm);
				setGeneratedSignature(result.signature);

				// Сохраняем данные в хранилище
				setOperationData(prev => ({
					...prev,
					signVerify: {
						...prev.signVerify,
						message: message,
						generatedSignature: result.signature
					}
				}));

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
			if (!message.trim() || !signature.trim()) {
				NotificationManager.warning('Заполните все поля для верификации');
				return;
			}
			if (!keyPair?.public_key) {
				NotificationManager.error('Публичный ключ не сгенерирован');
				return;
			}

			setIsProcessing(true);
			try {
				const result = await verifyECC(message, signature, keyPair.public_key, hashAlgorithm);
				setVerificationResult(result.is_valid);

				// Сохраняем данные в хранилище
				setOperationData(prev => ({
					...prev,
					signVerify: {
						...prev.signVerify,
						message: message,
						signature: signature
					}
				}));

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
			if (!keyPair?.public_key) {
				NotificationManager.error('Публичный ключ не сгенерирован');
				return;
			}

			setIsProcessing(true);
			try {
				const result = await encryptECC(message, keyPair.public_key);

				let parsedEncrypted;
				try {
					parsedEncrypted = JSON.parse(result.encrypted);
				} catch (e) {
					parsedEncrypted = result.encrypted;
				}

				setEncryptedResult(parsedEncrypted);
				const encryptedDataStr = JSON.stringify(parsedEncrypted, null, 2);
				setEncryptedData(encryptedDataStr);

				// Сохраняем данные в хранилище
				setOperationData(prev => ({
					...prev,
					encryptDecrypt: {
						...prev.encryptDecrypt,
						message: message,
						encryptedData: encryptedDataStr,
						encryptedResult: parsedEncrypted
					}
				}));

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
			if (!keyPair?.private_key) {
				NotificationManager.error('Приватный ключ не сгенерирован');
				return;
			}

			setIsProcessing(true);
			try {
				let dataToDecrypt = encryptedData;
				try {
					const parsed = JSON.parse(encryptedData);
					if (typeof parsed === 'object') {
						dataToDecrypt = JSON.stringify(parsed);
					}
				} catch (e) {
					// Если не JSON, используем как есть
				}

				const result = await decryptECC(dataToDecrypt, keyPair.private_key);
				setDecryptedResult(result.decrypted);

				// Сохраняем данные в хранилище
				setOperationData(prev => ({
					...prev,
					encryptDecrypt: {
						...prev.encryptDecrypt,
						encryptedData: encryptedData,
						decryptedResult: result.decrypted
					}
				}));

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
			setSignature('');
			setGeneratedSignature('');
			setVerificationResult(null);
			setEncryptedResult(null);
			setDecryptedResult('');

			// Очищаем хранилище
			setOperationData({
				signVerify: {
					message: '',
					signature: '',
					generatedSignature: ''
				},
				encryptDecrypt: {
					message: '',
					encryptedData: '',
					encryptedResult: null,
					decryptedResult: ''
				}
			});
		};

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

		// Обработчик переключения операции с сохранением данных
		const handleOperationChange = (newOperation) => {
			// Сохраняем текущие данные перед переключением
			if (operation === 'sign' || operation === 'verify') {
				setOperationData(prev => ({
					...prev,
					signVerify: {
						...prev.signVerify,
						message: message,
						signature: signature
					}
				}));
			} else {
				setOperationData(prev => ({
					...prev,
					encryptDecrypt: {
						...prev.encryptDecrypt,
						message: message,
						encryptedData: encryptedData
					}
				}));
			}

			// Очищаем временные результаты при переключении
			setGeneratedSignature('');
			setVerificationResult(null);
			setDecryptedResult('');
			setEncryptedResult(null);

			setOperation(newOperation);
		};

		// Операции для переключателя
		const operations = [
			{ id: 'sign', label: 'Подписать', icon: 'pen-tool' },
			{ id: 'verify', label: 'Проверить', icon: 'check' },
			{ id: 'encrypt', label: 'Зашифровать', icon: 'lock' },
			{ id: 'decrypt', label: 'Расшифровать', icon: 'lock-open' }
		];

		return (
			<div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto" data-name="ecc-panel">
				<div className="section-header">
					<h2 className="section-title text-2xl sm:text-3xl lg:text-4xl">Криптография на эллиптических кривых (ECC)</h2>
					<p className="section-subtitle text-base sm:text-lg">
						Высокоэффективная асимметричная криптография с малыми размерами ключей
					</p>
				</div>

				<div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
					{/* Левая колонка - ключи и настройки */}
					<div className="card p-4 sm:p-6 lg:p-8">
						<div className="flex items-center space-x-3 mb-4 sm:mb-6">
							<div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--primary-color)] rounded-xl flex items-center justify-center">
								<div className="icon-key text-lg sm:text-xl text-white"></div>
							</div>
							<h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">Ключи ECC</h3>
						</div>

						<div className="space-y-6">
							{/* Выбор кривой */}
							<div>
								<label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">Кривая</label>
								<select
									value={curve}
									onChange={(e) => {
										setCurve(e.target.value);
										clearFields();
									}}
									className="input-field"
									disabled={isProcessing}
								>
									<option value="P-256">P-256 (secp256r1) - Наиболее распространенная</option>
									<option value="P-384">P-384 (secp384r1) - Высокая безопасность</option>
									<option value="P-521">P-521 (secp521r1) - Максимальная безопасность</option>
								</select>
								<p className="text-xs text-[var(--text-secondary)] mt-1">При смене кривой генерируются новые ключи</p>
							</div>

							{/* Хэш-алгоритм для подписи/проверки */}
							{(operation === 'sign' || operation === 'verify') && (
								<div>
									<label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">Хэш-алгоритм</label>
									<select
										value={hashAlgorithm}
										onChange={(e) => setHashAlgorithm(e.target.value)}
										className="input-field"
										disabled={isProcessing}
									>
										<option value="SHA256">SHA-256</option>
										<option value="SHA512">SHA-512</option>
									</select>
								</div>
							)}

							{/* Отображение ключей */}
							{keyPair && (
								<div className="space-y-4">
									<div>
										<label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
											Публичный ключ (Base64)
										</label>
										<div className="p-3 bg-[var(--bg-tertiary)] rounded-xl">
											<p className="text-xs font-mono text-[var(--text-secondary)] break-all">
												{keyPair.public_key.substring(0, 100)}...
											</p>
										</div>
									</div>

									<div>
										<label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
											Приватный ключ (Base64)
										</label>
										<div className="p-3 bg-[var(--bg-tertiary)] rounded-xl">
											<p className="text-xs font-mono text-[var(--text-secondary)] break-all">
												{keyPair.private_key.substring(0, 100)}...
											</p>
										</div>
										<p className="text-xs text-[var(--text-secondary)] mt-1">Кривая: {keyPair.curve}</p>
									</div>

									<div className="flex space-x-3">
										<button
											onClick={generateNewKeyPair}
											disabled={isProcessing}
											className="btn-secondary flex-1 disabled:opacity-50"
										>
											<div className="icon-refresh-cw text-lg mr-2"></div>
											Новые ключи
										</button>
										<button
											onClick={clearFields}
											className="btn-secondary flex-1"
										>
											<div className="icon-x text-lg mr-2"></div>
											Очистить
										</button>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Правая колонка - операции */}
					<div className="xl:col-span-2">
						<div className="card p-4 sm:p-6 lg:p-8">
							<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
								<div className="flex items-center space-x-3">
									<div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--accent-color)] rounded-xl flex items-center justify-center">
										<div className="icon-shield-check text-lg sm:text-xl text-white"></div>
									</div>
									<h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
										{operation === 'sign' ? 'Создание подписи' :
											operation === 'verify' ? 'Проверка подписи' :
												operation === 'encrypt' ? 'Шифрование' : 'Расшифрование'}
									</h3>
								</div>

								{/* Переключатель операций */}
								<div className="grid grid-cols-4 gap-2 w-full sm:w-auto">
									{operations.map(op => (
										<button
											key={op.id}
											onClick={() => handleOperationChange(op.id)}
											className={`px-3 py-2 rounded-xl font-medium text-xs sm:text-sm transition-all duration-300 ${operation === op.id
												? 'bg-[var(--primary-color)] text-white'
												: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
												}`}
											disabled={isProcessing}
										>
											<div className={`icon-${op.icon} inline-block mr-1`}></div>
											{op.label}
										</button>
									))}
								</div>
							</div>

							<div className="space-y-6">
								{/* Поле сообщения для всех операций, кроме расшифрования */}
								{(operation === 'sign' || operation === 'verify' || operation === 'encrypt') && (
									<div>
										<label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
											{operation === 'sign' ? 'Сообщение для подписи' :
												operation === 'verify' ? 'Сообщение для проверки' :
													'Сообщение для шифрования'}
										</label>
										<textarea
											value={message}
											onChange={(e) => setMessage(e.target.value)}
											className="input-field h-32 resize-none"
											placeholder={operation === 'encrypt'
												? "Введите сообщение для шифрования..."
												: "Введите текст сообщения..."}
											disabled={isProcessing}
										/>
									</div>
								)}

								{/* Поле подписи для проверки */}
								{operation === 'verify' && (
									<div>
										<label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
											Подпись для проверки (Base64)
										</label>
										<textarea
											value={signature}
											onChange={(e) => setSignature(e.target.value)}
											className="input-field h-24 resize-none font-mono text-sm"
											placeholder="Введите подпись в формате Base64..."
											disabled={isProcessing}
										/>
									</div>
								)}

								{/* Поле зашифрованных данных для расшифрования */}
								{operation === 'decrypt' && (
									<div>
										<label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
											Зашифрованные данные (JSON)
										</label>
										<textarea
											value={encryptedData}
											onChange={(e) => setEncryptedData(e.target.value)}
											className="input-field h-32 resize-none font-mono text-sm"
											placeholder='Введите зашифрованные данные в формате JSON: {"ephemeral_pubkey": "...", "nonce": "...", "tag": "...", "ciphertext": "..."}'
											disabled={isProcessing}
										/>
									</div>
								)}

								{/* Кнопка выполнения операции */}
								<button
									onClick={operation === 'sign' ? handleSign :
										operation === 'verify' ? handleVerify :
											operation === 'encrypt' ? handleEncrypt : handleDecrypt}
									disabled={isProcessing ||
										(operation === 'sign' && !message.trim()) ||
										(operation === 'verify' && (!message.trim() || !signature.trim())) ||
										(operation === 'encrypt' && !message.trim()) ||
										(operation === 'decrypt' && !encryptedData.trim())}
									className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isProcessing ? (
										<>
											<div className="icon-loader-2 text-lg mr-2 animate-spin"></div>
											{operation === 'sign' ? 'Создание подписи...' :
												operation === 'verify' ? 'Проверка подписи...' :
													operation === 'encrypt' ? 'Шифрование...' : 'Расшифрование...'}
										</>
									) : (
										<>
											<div className={`icon-${operation === 'sign' ? 'pen-tool' :
												operation === 'verify' ? 'check-circle' :
													operation === 'encrypt' ? 'lock' : 'lock-open'} text-lg mr-2`}></div>
											{operation === 'sign' ? 'Подписать сообщение' :
												operation === 'verify' ? 'Проверить подпись' :
													operation === 'encrypt' ? 'Зашифровать сообщение' : 'Расшифровать сообщение'}
										</>
									)}
								</button>

								{/* Отображение результатов */}
								{operation === 'sign' && generatedSignature && (
									<div className="mt-6 p-4 bg-[var(--bg-primary)] rounded-xl">
										<div className="flex items-center justify-between mb-3">
											<label className="block text-sm font-semibold text-[var(--text-primary)]">
												Цифровая подпись (Base64)
											</label>
											<CopyButton text={generatedSignature} />
										</div>
										<textarea
											value={generatedSignature}
											readOnly
											className="input-field h-24 resize-none bg-[var(--bg-tertiary)] font-mono text-sm"
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
										/>
										<p className="text-xs text-[var(--text-secondary)] mt-2">
											Формат: ECDH + AES-GCM • Длина: {JSON.stringify(encryptedResult).length} символов
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

				{/* Информационная секция */}
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
