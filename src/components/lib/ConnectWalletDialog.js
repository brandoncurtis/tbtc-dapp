import React, { Component, useReducer, useState } from 'react'
import Check from '../svgs/Check'
import { useWeb3React } from '@web3-react/core'
import { InjectedConnector } from '@web3-react/injected-connector'
import { LedgerConnector } from '../../connectors/ledger'
import { TrezorConnector } from '../../connectors/trezor'

const CHAIN_ID = process.env.CHAIN_ID || 1337
const ETH_RPC_URL = process.env.ETH_RPC_URL || 'ws://localhost:8545'

// Connectors.
const injectedConnector = new InjectedConnector({})

const ledgerConnector = new LedgerConnector({
    chainId: CHAIN_ID,
	url: ETH_RPC_URL
})

const trezorConnector = new TrezorConnector({ 
	chainId: 1,
	pollingInterval: 1000,
	requestTimeoutMs: 1000,
	config: {
		// TODO: Trezor's API will throw for larger network id's. 
		// TODO: apply same solution as Ledger.
		chainId: CHAIN_ID,
	},
	url: ETH_RPC_URL,
	manifestEmail: 'contact@keep.network', 
	manifestAppUrl: 'https://localhost'
})

// Wallets.
const WALLETS = [
	{
		name: "Metamask",
		icon: "/images/metamask-fox.svg",
		showName: true,
		connector: injectedConnector
	},
	{
		name: "Ledger",
		icon: "/images/ledger.svg",
		connector: ledgerConnector
	},
	{
		name: "Trezor",
		icon: "/images/trezor.png",
		connector: trezorConnector
	}
]


export const ConnectWalletDialog = ({ shown, onConnected, onClose }) => {
	const { active, account, activate, chainId, connector } = useWeb3React()

	let [chosenWallet, setChosenWallet] = useState(null)
	let [error, setError] = useState(null)
	let state = {
		chosenWallet,
		error
	}

	async function chooseWallet(wallet) {
		setChosenWallet(wallet)

		try {
			await activate(wallet.connector, undefined, true)
			onConnected()
		} catch(ex) {
			setError(ex.toString())
			throw ex
		}
	}

	const ChooseWalletStep = () => {
		return <>
			<div className="title">Connect to a wallet</div>
			<p>This wallet will be used to sign transactions on Ethereum.</p>
 
			<ul className='wallets'>
				{
					WALLETS.map(wallet => {
						return <li className='wallet-option' onClick={() => chooseWallet(wallet)}>
							<img src={wallet.icon} />
							{wallet.showName && wallet.name}
						</li>
					})
				}
			</ul>
		</>
	}

	const ConnectToWalletStep = () => {
		if(error) {
			return <ErrorConnecting/>
		}

		if(chosenWallet.name == 'Ledger') {
			return <>
				<div className="title">Plug In Ledger & Enter Pin</div>
				<p>Open Ethereum application and make sure Contract Data and Browser Support are enabled.</p>
				<p>Connecting...</p>
			</>
		}

		return <>
			<div className="title">Connect to a wallet</div>
			<p>Connecting to {chosenWallet.name} wallet...</p>
		</>
	}

	const ErrorConnecting = () => {
		return <>
			<div className="title">Connect to a wallet</div>
			<p>Error connecting to {chosenWallet.name} wallet...</p>
			<a onClick={async () => {
				setError(null)
				await chooseWallet(chosenWallet)
			}}>
				Try Again
			</a>
			{ error && <p>{error}</p> }
		</>
	}

	const ConnectedView = () => {
		return <div className='connected-view'>
			<div className="title">Wallet connected</div>
			<div className='details'>
				<p>{chosenWallet.name}</p>
				<p>Account: {account}</p>
			</div>
		</div>
	}

	return <div className={`modal connect-wallet ${shown ? 'open' : 'closed'}`}>
		<div className="modal-body">
			<div className="close">
				<div className="x" onClick={onClose}>&#9587;</div>
			</div>
			{!chosenWallet && <ChooseWalletStep />}
			{(chosenWallet && !active) && <ConnectToWalletStep />}
			{(chosenWallet && active) && <ConnectedView />}
		</div>
	</div>
}