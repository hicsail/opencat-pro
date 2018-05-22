'use strict';

const Lab = require('lab');
const Code = require('code');
const Locale = require('locale');
const HelperMethods = require('../../server/helperMethods');


const lab = exports.lab = Lab.script();

const enLocale = 'en';
const enusLocale = 'en_US';
const esLocale = 'es';
const frLocale = 'fr';
const genericTestString = 'Generic Test String';
const genericArrayString = 'ArrayEntry';
const genericArrayString0 = genericArrayString + 0;
const genericArrayString1 = genericArrayString + 1;
const genericArrayString2 = genericArrayString + 2;

const genericTestArray = [
    genericArrayString0,
    genericArrayString1,
    genericArrayString2
];

const util = require('util');

lab.experiment('getLocaleResource tests', () => {

    lab.test('String input', (done) => {
        var locale = new Locale.Locales(enLocale);
        var result = HelperMethods.getLocaleResource (locale, genericTestString);

        Code.expect(result).to.be.a.string().and.equal(genericTestString);
    });

    lab.test('Requested locale exists', (done) => {
        var locale = new Locale.Locales(enLocale);
        const source = {
            [enLocale]: genericTestString
        };

        var result = HelperMethods.getLocaleResource (locale, source);

        Code.expect(result).to.be.a.string().and.equal(genericTestString);

    });

    lab.test('Requested locale does not exist, return default locale', (done) => {
        var locale = new Locale.Locales(frLocale);
        const source = {
            [enLocale]: genericTestString
        };
        var result = HelperMethods.getLocaleResource (locale, source);

        Code.expect(result).to.be.a.string().and.equal(genericTestString);
    });

    lab.test('Country variation does not exist, return language only locale', (done) => {
        var locale = new Locale.Locales(enusLocale);
        const source = {
            [enLocale]: genericTestString
        };

        var result = HelperMethods.getLocaleResource (locale, source);

        Code.expect(result).to.be.a.string().and.equal(genericTestString);
    });

    lab.test('Find prefered language', (done) => {
        var locale = new Locale.Locales('en-us, en;q=0.8, fr;q=0.7');
        const source = {
            [enLocale]: 'EN-'+genericTestString,
            [frLocale]: 'FR-'+genericTestString,
            [enusLocale]: 'ENUS-'+genericTestString
        }

        var result = HelperMethods.getLocaleResource (locale, source);

        Code.expect(result).to.be.a.string().and.equal('ENUS-'+genericTestString);
    });

    lab.test('Find secondary language', (done) => {
        var locale = new Locale.Locales('es, en;q=0.8, fr;q=0.7');
        const source = {
            [enLocale]: 'EN-'+genericTestString,
            [frLocale]: 'FR-'+genericTestString,
            [enusLocale]: 'ENUS-'+genericTestString
        }

        var result = HelperMethods.getLocaleResource (locale, source);

        Code.expect(result).to.be.a.string().and.equal('EN-'+genericTestString);
    });

    lab.test('Array input',(done) => {
        var locale = new Locale.Locales(enLocale);

        var result = HelperMethods.getLocaleResource (locale, genericTestArray);

        Code.expect(result).to.be.a.array();
        Code.expect(result[0]).equal(genericArrayString0);
        Code.expect(result[1]).equal(genericArrayString1);
    });
});
