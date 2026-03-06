import './mock_globals.mjs';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { t, getLang, setLang, TRANSLATIONS } from '../js/i18n.mjs';

describe('i18n utility tests', () => {

    test('getLang() should return current language', () => {
        // Initial language should be 'en' since mock localStorage.getItem returns null
        assert.equal(getLang(), 'en');
    });

    test('setLang(lang) should update language and persist to localStorage', () => {
        setLang('pt');
        assert.equal(getLang(), 'pt');
        assert.equal(globalThis.localStorage.getItem('app-lang'), 'pt');

        setLang('es');
        assert.equal(getLang(), 'es');
        assert.equal(globalThis.localStorage.getItem('app-lang'), 'es');
    });

    test('setLang(lang) should ignore invalid languages', () => {
        const current = getLang();
        setLang('fr'); // Not in TRANSLATIONS
        assert.equal(getLang(), current);
    });

    test('t(key) should return basic translation in current language', () => {
        setLang('en');
        assert.equal(t('app.title'), 'Emerald — Markdown Editor');

        setLang('pt');
        assert.equal(t('app.title'), 'Emerald — Editor Markdown');
    });

    test('t(key, ...args) should replace placeholders', () => {
        setLang('en');
        assert.equal(t('msg.delete_folder', 'MyNotes'), 'Delete folder "MyNotes" and all its contents?');

        setLang('es');
        assert.equal(t('msg.delete_folder', 'MisNotas'), '¿Eliminar carpeta "MisNotas" y todo su contenido?');
    });

    test('t(key) should fallback to English when key is missing in current language', () => {
        // Mock a missing key in 'es'
        const originalEs = TRANSLATIONS.es;
        TRANSLATIONS.es = { ...originalEs };
        delete TRANSLATIONS.es['sidebar.notes'];

        setLang('es');
        // If key is missing in currentLang, it should fallback to 'en'
        assert.equal(t('sidebar.notes'), 'Notes');

        // Clean up
        TRANSLATIONS.es = originalEs;
    });

    test('t(key) should return key itself if not found anywhere', () => {
        assert.equal(t('non.existent.key'), 'non.existent.key');
    });

});
