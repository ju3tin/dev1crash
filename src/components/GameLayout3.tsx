'use client';
import { PropsWithChildren }from 'react';

import styles from '../styles/GameLayout1.module.css';

export type GameLayoutProps = PropsWithChildren;

export default function GameLayout({
	children
}: GameLayoutProps) {
	return <div className={styles.GameLayout}>{children}</div>;
}
