
import { StaticImageData } from 'next/image';

import ChippyIcon from '../images/currencies/31832.png';
import SolanaIcon from '../images/currencies/sol.svg';
import DemoIcon from '../images/currencies/demo.svg';

export type CurrencyId = 'demo' | 'sol' | 'chp';

export type Currency = {
	id: CurrencyId;
	coinId: number;
	name: string;
	units: string;
	icon: StaticImageData;
	decimals: number;
	contractDecimals: number;
}

export const currencies: Currency[] = [
	{
		id: 'demo',
		coinId: 0,
		name: 'Demo',
		units: 'Demo',
		icon:  DemoIcon,
		decimals: 8,
		contractDecimals: 18,
	},{
		id: 'sol',
		coinId: 1,
		name: 'Solana',
		units: 'SOL',
		icon:  SolanaIcon,
		decimals: 8,
		contractDecimals: 18,
	},
	{
		id: 'chp',
		coinId: 2,
		name: 'Chippy',
		units: 'CHP',
		icon:  ChippyIcon,
		decimals: 8,
		contractDecimals: 8,
	},
	/*{
		id: 'usdc',
		coinId: 3,
		name: 'USDC',
		units: 'USDC',
		icon:  UsdcIcon,
		decimals: 2,
		contractDecimals: 6,
	},*/
] as const;

export const coinContracts: Record<string, Record<string, string>> = {
	'0x89': {
		'eth': '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
		'btc': '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6',
		//'usdc': '0x2791bca1f2de4661ed88a30c99a7a9449aa84174'
	},
	'0x13881': {
		'eth': '0xD92f1A998A1F76913d1Aad3923fDf9dFAD73F013',
		'btc': '0xB568bd9F4572cdb62099ab2e70a25277c5118b15',
		//'usdc': '0xE8F6F19f030921860765975cf99bcF513832b285'
	}
} as const;

export const currencyById = Object.fromEntries(
	currencies.map(currency => [currency.id, currency])
);
