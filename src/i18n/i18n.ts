import { translations } from './translations';

export type Language = 'en' | 'ja';

export class I18nManager {
	private static instance: I18nManager;
	private currentLang: Language = 'en';

	private constructor() {
		// Singleton
	}

	public static getInstance(): I18nManager {
		if (!I18nManager.instance) {
			I18nManager.instance = new I18nManager();
		}
		return I18nManager.instance;
	}

	public init() {
		// 1. Check URL query param ?lang=ja or ?lang=en
		const params = new URLSearchParams(window.location.search);
		const paramLang = params.get('lang');
		if (paramLang === 'ja' || paramLang === 'en') {
			this.currentLang = paramLang;
		} else {
			// 2. Check localStorage
			const storedLang = localStorage.getItem('musubi_lang');
			if (storedLang === 'ja' || storedLang === 'en') {
				this.currentLang = storedLang;
			}
		}

		this.applyTranslations(this.currentLang);
		this.bindToggleEvents();

		// Dispatch custom event on init so components synchronize their initial state
		window.dispatchEvent(
			new CustomEvent('musubi:languageChange', {
				detail: { lang: this.currentLang }
			})
		);
	}

	public getLanguage(): Language {
		return this.currentLang;
	}

	public setLanguage(lang: Language) {
		this.currentLang = lang;
		localStorage.setItem('musubi_lang', lang);

		// Update URL query param cleanly without reload
		const url = new URL(window.location.href);
		url.searchParams.set('lang', lang);
		window.history.replaceState({}, '', url.toString());

		this.applyTranslations(lang);

		// Dispatch custom event for components with dynamic client-side JS
		window.dispatchEvent(
			new CustomEvent('musubi:languageChange', {
				detail: { lang }
			})
		);
	}

	public t(key: string, lang: Language = this.currentLang): string {
		return translations[lang]?.[key] ?? translations['en']?.[key] ?? key;
	}

	public applyTranslations(lang: Language) {
		document.documentElement.lang = lang;

		// 1. Update text content or innerHTML for elements with [data-i18n]
		const translatableElements = document.querySelectorAll<HTMLElement>('[data-i18n]');
		translatableElements.forEach((el) => {
			const key = el.getAttribute('data-i18n');
			if (!key) return;
			const text = this.t(key, lang);
			if (text.includes('<') && text.includes('>')) {
				el.innerHTML = text;
			} else {
				el.textContent = text;
			}
		});

		// 2. Update placeholders with [data-i18n-placeholder]
		const placeholderElements = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-i18n-placeholder]');
		placeholderElements.forEach((el) => {
			const key = el.getAttribute('data-i18n-placeholder');
			if (!key) return;
			el.placeholder = this.t(key, lang);
		});

		// 3. Update titles with [data-i18n-title]
		const titleElements = document.querySelectorAll<HTMLElement>('[data-i18n-title]');
		titleElements.forEach((el) => {
			const key = el.getAttribute('data-i18n-title');
			if (!key) return;
			el.title = this.t(key, lang);
		});

		// 4. Update language toggle button states
		const toggleButtons = document.querySelectorAll<HTMLButtonElement>('[data-lang-choice]');
		toggleButtons.forEach((btn) => {
			const targetChoice = btn.getAttribute('data-lang-choice');
			if (targetChoice === lang) {
				btn.classList.add('active');
			} else {
				btn.classList.remove('active');
			}
		});
	}

	private bindToggleEvents() {
		const toggleButtons = document.querySelectorAll<HTMLButtonElement>('[data-lang-choice]');
		toggleButtons.forEach((btn) => {
			btn.addEventListener('click', () => {
				const choice = btn.getAttribute('data-lang-choice') as Language;
				if (choice === 'en' || choice === 'ja') {
					this.setLanguage(choice);
				}
			});
		});
	}
}

// Auto-initialize when script loads in browser
if (typeof window !== 'undefined') {
	document.addEventListener('DOMContentLoaded', () => {
		I18nManager.getInstance().init();
	});
}
