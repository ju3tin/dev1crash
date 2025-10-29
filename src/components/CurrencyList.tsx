import Image from "next/image";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import { currencies } from "../lib/currencies";
import styles from "../styles/components/CurrencyList.module.css";

export type CurrencyListProps = {
	balances: Record<string, string>; // Currency balances
	onCurrencyChange: (selectedCurrency: string) => void; // Callback for selected currency
};

export default function CurrencyList({
	balances,
	onCurrencyChange,
}: CurrencyListProps) {
	const handleChange = (value: string) => {
		onCurrencyChange(value); // Notify parent component
	};

	return (
		<Select defaultValue={currencies[0].id} onValueChange={handleChange}>
			<SelectTrigger>
				<SelectValue placeholder="Select a currency" />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					<SelectLabel>Currencies</SelectLabel>
					{currencies.map((currency) => (
						<SelectItem
							value={currency.id}
							className={styles.SelectItem}
							key={currency.id}
						>
							<div className={styles.CurrencyItem}>
								<div className={styles.CurrencyLabel}>
									<Image src={currency.icon} alt={currency.units} width={20} height={20} />
									<span>{currency.name}</span>
								</div>
								<div>
									{balances[currency.id] ?? "-"} {currency.units}
								</div>
							</div>
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}