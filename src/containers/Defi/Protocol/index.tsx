import * as React from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/future/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import styled from 'styled-components'
import { transparentize } from 'polished'
import { ArrowUpRight, ChevronRight, DownloadCloud } from 'react-feather'
import Layout from '~/layout'
import {
	Button,
	DetailsTable,
	DownloadButton,
	ExtraOption,
	FlexRow,
	InfoWrapper,
	LinksWrapper,
	DetailsWrapper,
	Name,
	Section,
	SectionHeader,
	Symbol,
	ChartsWrapper,
	LazyChart,
	ChartsPlaceholder
} from '~/layout/ProtocolAndPool'
import { Stat, StatsSection, StatWrapper } from '~/layout/Stats/Medium'
import { Checkbox2 } from '~/components'
import Bookmark from '~/components/Bookmark'
import CopyHelper from '~/components/Copy'
import FormattedName from '~/components/FormattedName'
import TokenLogo from '~/components/TokenLogo'
import SEO from '~/components/SEO'
import { ProtocolsChainsSearch } from '~/components/Search'
import AuditInfo from '~/components/AuditInfo'
import ProtocolChart from '~/components/ECharts/ProtocolChart/ProtocolChart'
import QuestionHelper from '~/components/QuestionHelper'
import type { IBarChartProps, IChartProps, IPieChartProps } from '~/components/ECharts/types'
import { protocolsAndChainsOptions } from '~/components/Filters/protocols'
import { useScrollToTop } from '~/hooks'
import { DEFI_SETTINGS_KEYS, useDefiManager } from '~/contexts/LocalStorage'
import {
	capitalizeFirstLetter,
	formattedNum,
	getBlockExplorer,
	slug,
	standardizeProtocolName,
	toK,
	tokenIconUrl
} from '~/utils'
import { useFetchProtocol } from '~/api/categories/protocols/client'
import type { IFusedProtocolData } from '~/api/types'
import { useYields } from '~/api/categories/yield/client'
import boboLogo from '~/assets/boboSmug.png'
import { formatTvlsByChain, buildProtocolAddlChartsData, formatRaisedAmount, formatRaise } from './utils'
import { Treasury } from './Treasury'
import type { IArticle } from '~/api/categories/news'
import { NewsCard } from '~/components/News/Card'
import { Emissions } from './Emissions'
import { RowBetween } from '~/components/Row'
import { DLNewsLogo } from '~/components/News/Logo'
import { ProtocolFeesAndRevenueCharts } from './Fees'
import type { IEmission } from './Emissions'
import Announcement from '~/components/Announcement'

const scams = ['Drachma Exchange', 'StableDoin', 'CroLend Finance', 'Agora', 'MinerSwap', 'Mosquitos Finance']

const AreaChart = dynamic(() => import('~/components/ECharts/AreaChart'), {
	ssr: false
}) as React.FC<IChartProps>

const BarChart = dynamic(() => import('~/components/ECharts/BarChart'), {
	ssr: false
}) as React.FC<IBarChartProps>

const PieChart = dynamic(() => import('~/components/ECharts/PieChart'), {
	ssr: false
}) as React.FC<IPieChartProps>

const Bobo = styled.button`
	position: absolute;
	bottom: -36px;
	left: 0;

	img {
		width: 34px !important;
		height: 34px !important;
	}

	@media screen and (min-width: 80rem) {
		top: 0;
		right: 0;
		bottom: initial;
		left: initial;
		z-index: 1;
	}
`

export const OtherProtocols = styled.nav`
	grid-column: span 1;
	display: flex;
	overflow-x: auto;
	background: ${({ theme }) => theme.bg7};
	font-weight: 500;
	border-radius: 12px 12px 0 0;

	@media screen and (min-width: 80rem) {
		grid-column: span 2;
	}
`

const RaisesWrapper = styled.ul`
	list-style: none;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 8px;
`

interface IProtocolLink {
	active: boolean
	color: string | null
}

export const ProtocolLink = styled.a<IProtocolLink>`
	padding: 8px 24px;
	white-space: nowrap;

	& + & {
		border-left: ${({ theme }) => '1px solid ' + theme.divider};
	}

	border-bottom: ${({ active, color, theme }) => '1px solid ' + (active ? color : theme.divider)};

	:first-child {
		border-top-left-radius: 12px;
	}

	:hover,
	:focus-visible {
		background-color: ${({ color }) => transparentize(0.9, color)};
	}
`

interface IToggleProps {
	backgroundColor: string
}

const Toggle = styled.label<IToggleProps>`
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;

	input {
		position: absolute;
		width: 1em;
		height: 1em;
		opacity: 0.00001;
	}

	span[data-wrapper='true'] {
		position: relative;
		z-index: 1;
		padding: 8px 12px;
		background: red;
		border-radius: 10px;
		display: flex;
		align-items: center;
		flex-wrap: nowrap;
		gap: 4px;
		background: ${({ backgroundColor, theme }) =>
			backgroundColor ? transparentize(0.8, backgroundColor) : transparentize(0.8, theme.primary1)};
	}

	input:checked + span[data-wrapper='true'] {
		background: ${({ backgroundColor, theme }) =>
			backgroundColor ? transparentize(0.4, backgroundColor) : transparentize(0.4, theme.primary1)};
	}

	input:focus-visible {
		outline: none;
	}

	input:focus-visible + span[data-wrapper='true'] {
		outline: ${({ theme }) => '1px solid ' + theme.text1};
		outline-offset: 1px;
	}
`

const ToggleWrapper = styled.span`
	display: flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
`

const Details = styled.details`
	&[open] {
		summary {
			& > *[data-arrowicon] {
				transform: rotate(90deg);
				transition: 0.1s ease;
			}
		}
	}

	summary {
		display: flex;
		gap: 16px;
		flex-wrap: wrap;
		align-items: center;
		list-style: none;
		list-style-type: none;
		cursor: pointer;

		& > *[data-arrowicon] {
			position: relative;
			left: -20px;
			margin-right: -32px;
		}
	}

	summary::-webkit-details-marker {
		display: none;
	}

	summary + span {
		margin-top: 16px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
`

interface IProtocolContainerProps {
	articles: IArticle[]
	title: string
	protocol: string
	protocolData: IFusedProtocolData
	backgroundColor: string
	similarProtocols: Array<{ name: string; tvl: number }>
	emissions: IEmission
	isCEX?: boolean
	chartColors: { [type: string]: string }
	users: { users: number }
	tokenPrice: number | null
	tokenMcap: number | null
	tokenSupply: number | null
	allTimeFees: number | null
	dailyFees: number | null
	dailyRevenue: number | null
	dailyVolume: number | null
	allTimeVolume: number | null
}

const isLowerCase = (letter: string) => letter === letter.toLowerCase()

function ProtocolContainer({
	articles,
	title,
	protocolData,
	protocol,
	backgroundColor,
	similarProtocols,
	emissions,
	isCEX,
	chartColors,
	users,
	tokenPrice: priceOfToken,
	tokenMcap,
	tokenSupply,
	allTimeFees,
	dailyFees,
	dailyRevenue,
	dailyVolume,
	allTimeVolume
}: IProtocolContainerProps) {
	useScrollToTop()

	const {
		address = '',
		name,
		symbol,
		url,
		description,
		audits,
		category,
		twitter,
		tvlBreakdowns = {},
		tvlByChain = [],
		audit_links,
		methodology,
		module: codeModule,
		historicalChainTvls,
		chains = [],
		forkedFrom,
		otherProtocols,
		hallmarks,
		gecko_id,
		isParentProtocol,
		raises,
		treasury,
		metrics
	} = protocolData

	const router = useRouter()

	const { blockExplorerLink, blockExplorerName } = getBlockExplorer(address)

	const [bobo, setBobo] = React.useState(false)

	const [extraTvlsEnabled, updater] = useDefiManager()

	const totalVolume = React.useMemo(() => {
		let tvl = 0

		Object.entries(tvlBreakdowns).forEach(([section, sectionTvl]: any) => {
			if (section.includes('-') || section === 'offers') return

			if (section === 'doublecounted') {
				tvl -= sectionTvl
			}

			if (Object.keys(extraTvlsEnabled).includes(section.toLowerCase())) {
				// convert to lowercase as server response is not consistent in extra-tvl names
				if (extraTvlsEnabled[section.toLowerCase()]) tvl += sectionTvl
			} else {
				tvl += sectionTvl
			}
		})

		if (tvl === 0 && Object.keys(tvlBreakdowns).length === 0) {
			Object.entries(historicalChainTvls).forEach(([section, sectionData]) => {
				if (section.includes('-')) return

				if (section === 'doublecounted') {
					tvl -= sectionData.tvl[sectionData.tvl.length - 1].totalLiquidityUSD
				}

				if (Object.keys(extraTvlsEnabled).includes(section.toLowerCase())) {
					// convert to lowercase as server response is not consistent in extra-tvl names
					if (extraTvlsEnabled[section.toLowerCase()])
						tvl += sectionData.tvl[sectionData.tvl.length - 1]?.totalLiquidityUSD ?? 0
				} else {
					tvl += sectionData.tvl[sectionData.tvl.length - 1]?.totalLiquidityUSD ?? 0
				}
			})
		}

		return tvl
	}, [extraTvlsEnabled, tvlBreakdowns, historicalChainTvls])

	const { data: yields } = useYields()

	const {
		tvls: tvlsByChain,
		extraTvls,
		tvlOptions
	} = tvlByChain.reduce(
		(acc, [name, tvl]: [string, number]) => {
			// skip masterchef tvl type
			if (name === 'masterchef' || name === 'offers') return acc

			// check if tvl name is addl tvl type and is toggled
			if (isLowerCase(name[0]) && DEFI_SETTINGS_KEYS.includes(name)) {
				acc.extraTvls.push([name, tvl])
				acc.tvlOptions.push(protocolsAndChainsOptions.find((e) => e.key === name))
			} else {
				// only include total tvl of each chain skip breakdown of addl tvls if extra tvl type is not toggled
				if (!name.includes('-')) {
					acc.tvls[name] = (acc.tvls[name] || 0) + tvl
				} else {
					// format name to only include chain name and check if it already exists in tvls list
					const chainName = name.split('-')[0]
					const prop = name.split('-')[1]

					// check if prop is toggled
					if (extraTvlsEnabled[prop.toLowerCase()]) {
						acc.tvls[chainName] = (acc.tvls[chainName] || 0) + tvl
					}
				}
			}
			return acc
		},
		{
			tvls: {},
			extraTvls: [],
			tvlOptions: []
		}
	)

	const tvls = Object.entries(tvlsByChain)

	const { data: addlProtocolData, loading } = useFetchProtocol(protocol)

	const { usdInflows, tokenInflows, tokensUnique, tokenBreakdown, tokenBreakdownUSD, tokenBreakdownPieChart } =
		React.useMemo(
			() => buildProtocolAddlChartsData({ protocolData: addlProtocolData, extraTvlsEnabled }),
			[addlProtocolData, extraTvlsEnabled]
		)

	const [yeildsNumber, averageApy] = React.useMemo(() => {
		if (!yields) return [0, 0]
		const projectYieldsExist = yields.find(({ project }) => project === protocol)
		if (!projectYieldsExist) return [0, 0]
		const projectYields = yields.filter(({ project }) => project === protocol)
		const averageApy = projectYields.reduce((acc, { apy }) => acc + apy, 0) / projectYields.length

		return [projectYields.length, averageApy]
	}, [protocol, yields])

	const chainsSplit = React.useMemo(() => {
		return formatTvlsByChain({ historicalChainTvls, extraTvlsEnabled })
	}, [historicalChainTvls, extraTvlsEnabled])

	const chainsUnique = tvls.map((t) => t[0])

	const showCharts =
		loading ||
		(chainsSplit && chainsUnique?.length > 1) ||
		(tokenBreakdown?.length > 1 && tokenBreakdownUSD?.length > 1 && tokensUnique?.length > 1) ||
		tokensUnique?.length > 0 ||
		usdInflows ||
		tokenInflows
			? true
			: false

	const queryParams = router.asPath.split('?')[1] ? `?${router.asPath.split('?')[1]}` : ''

	const { tvl, mcap, tokenPrice, fdv, volume, fees, revenue, unlocks, activeUsers, events } = router.query

	return (
		<Layout title={title} backgroundColor={transparentize(0.6, backgroundColor)} style={{ gap: '36px' }}>
			<SEO cardName={name} token={name} logo={tokenIconUrl(name)} tvl={formattedNum(totalVolume, true)?.toString()} />

			<ProtocolsChainsSearch step={{ category: 'Protocols', name }} options={tvlOptions} />

			{name === 'SyncDEX Finance' && (
				<Announcement warning={true} notCancellable={true}>
					Unstaking immediately is not available in this protocol and many users have reported red flags. Be careful.
				</Announcement>
			)}

			<StatsSection>
				{otherProtocols?.length > 1 && (
					<OtherProtocols>
						{otherProtocols.map((p) => (
							<Link href={`/protocol/${standardizeProtocolName(p)}`} key={p} passHref>
								<ProtocolLink
									active={router.asPath === `/protocol/${standardizeProtocolName(p)}` + queryParams}
									color={backgroundColor}
								>
									{p}
								</ProtocolLink>
							</Link>
						))}
					</OtherProtocols>
				)}

				<DetailsWrapper
					style={{ borderTopLeftRadius: otherProtocols?.length > 1 ? 0 : '12px', maxWidth: '300px', gap: '24px' }}
				>
					{scams.includes(name) && <p>There's been multiple hack reports in this protocol</p>}

					<Name>
						<TokenLogo logo={tokenIconUrl(name)} size={24} />
						<FormattedName text={name ? name + ' ' : ''} maxCharacters={16} fontWeight={700} />
						<Symbol>{symbol && symbol !== '-' ? `(${symbol})` : ''}</Symbol>

						{!isParentProtocol && <Bookmark readableProtocolName={name} />}
					</Name>

					{gecko_id ||
					hallmarks?.length > 0 ||
					metrics?.fees ||
					metrics?.dexs ||
					emissions?.chartData?.length > 0 ||
					users ? (
						<ToggleWrapper>
							<Toggle backgroundColor={backgroundColor}>
								<input
									type="checkbox"
									value="tvl"
									checked={tvl !== 'false'}
									onChange={() =>
										router.push(
											{
												pathname: router.pathname,
												query: { ...router.query, tvl: tvl === 'false' ? true : false }
											},
											undefined,
											{ shallow: true }
										)
									}
								/>
								<span data-wrapper="true">
									<span>TVL</span>
								</span>
							</Toggle>

							{gecko_id && (
								<>
									<Toggle backgroundColor={backgroundColor}>
										<input
											type="checkbox"
											value="mcap"
											checked={mcap === 'true'}
											onChange={() =>
												router.push(
													{
														pathname: router.pathname,
														query: { ...router.query, mcap: mcap === 'true' ? false : true }
													},
													undefined,
													{ shallow: true }
												)
											}
										/>
										<span data-wrapper="true">
											<span>Mcap</span>
										</span>
									</Toggle>

									<Toggle backgroundColor={backgroundColor}>
										<input
											type="checkbox"
											value="tokenPrice"
											checked={tokenPrice === 'true'}
											onChange={() =>
												router.push(
													{
														pathname: router.pathname,
														query: { ...router.query, tokenPrice: tokenPrice === 'true' ? false : true }
													},
													undefined,
													{ shallow: true }
												)
											}
										/>
										<span data-wrapper="true">
											<span>Token Price</span>
										</span>
									</Toggle>

									<Toggle backgroundColor={backgroundColor}>
										<input
											type="checkbox"
											value="fdv"
											checked={fdv === 'true'}
											onChange={() =>
												router.push(
													{
														pathname: router.pathname,
														query: { ...router.query, fdv: fdv === 'true' ? false : true }
													},
													undefined,
													{ shallow: true }
												)
											}
										/>
										<span data-wrapper="true">
											<span>FDV</span>
										</span>
									</Toggle>
								</>
							)}

							{metrics.dexs && (
								<Toggle backgroundColor={backgroundColor}>
									<input
										type="checkbox"
										value="volume"
										checked={volume === 'true'}
										onChange={() =>
											router.push(
												{
													pathname: router.pathname,
													query: { ...router.query, volume: volume === 'true' ? false : true }
												},
												undefined,
												{ shallow: true }
											)
										}
									/>
									<span data-wrapper="true">
										<span>Volume</span>
									</span>
								</Toggle>
							)}

							{metrics.fees && (
								<>
									<Toggle backgroundColor={backgroundColor}>
										<input
											type="checkbox"
											value="fees"
											checked={fees === 'true'}
											onChange={() =>
												router.push(
													{
														pathname: router.pathname,
														query: { ...router.query, fees: fees === 'true' ? false : true }
													},
													undefined,
													{ shallow: true }
												)
											}
										/>
										<span data-wrapper="true">
											<span>Fees</span>
										</span>
									</Toggle>

									<Toggle backgroundColor={backgroundColor}>
										<input
											type="checkbox"
											value="revenue"
											checked={revenue === 'true'}
											onChange={() =>
												router.push(
													{
														pathname: router.pathname,
														query: { ...router.query, revenue: revenue === 'true' ? false : true }
													},
													undefined,
													{ shallow: true }
												)
											}
										/>
										<span data-wrapper="true">
											<span>Revenue</span>
										</span>
									</Toggle>
								</>
							)}

							{emissions?.chartData?.length > 0 && (
								<Toggle backgroundColor={backgroundColor}>
									<input
										type="checkbox"
										value="unlocks"
										checked={unlocks === 'true'}
										onChange={() =>
											router.push(
												{
													pathname: router.pathname,
													query: { ...router.query, unlocks: unlocks === 'true' ? false : true }
												},
												undefined,
												{ shallow: true }
											)
										}
									/>
									<span data-wrapper="true">
										<span>Unlocks</span>
									</span>
								</Toggle>
							)}

							{users && (
								<Toggle backgroundColor={backgroundColor}>
									<input
										type="checkbox"
										value="activeUsers"
										checked={activeUsers === 'true'}
										onChange={() =>
											router.push(
												{
													pathname: router.pathname,
													query: { ...router.query, activeUsers: activeUsers === 'true' ? false : true }
												},
												undefined,
												{ shallow: true }
											)
										}
									/>
									<span data-wrapper="true">
										<span>Active Users</span>
									</span>
								</Toggle>
							)}

							{hallmarks?.length > 0 && (
								<Toggle backgroundColor={backgroundColor}>
									<input
										type="checkbox"
										value="events"
										checked={events !== 'false'}
										onChange={() =>
											router.push(
												{
													pathname: router.pathname,
													query: { ...router.query, events: events === 'false' ? true : false }
												},
												undefined,
												{ shallow: true }
											)
										}
									/>
									<span data-wrapper="true">
										<span>Events</span>
									</span>
								</Toggle>
							)}
						</ToggleWrapper>
					) : null}

					{tvl !== 'false' && (
						<Details>
							<summary>
								<span data-arrowicon>
									<ChevronRight size={16} />
								</span>

								<Stat as="span">
									<span>{isCEX ? 'Total Assets' : 'Total Value Locked'}</span>
									<span>{formattedNum(totalVolume || '0', true)}</span>
								</Stat>

								{!isParentProtocol && (
									<Link href={`https://api.llama.fi/dataset/${protocol}.csv`} passHref>
										<DownloadButton
											as="a"
											color={backgroundColor}
											style={{ height: 'fit-content', margin: 'auto 0 0 auto' }}
										>
											<DownloadCloud size={14} />
											<span>&nbsp;&nbsp;.csv</span>
										</DownloadButton>
									</Link>
								)}
							</summary>

							<span>
								{tvls.length > 0 && (
									<DetailsTable>
										<caption>{isCEX ? 'Assets by chain' : 'Chain Breakdown'}</caption>
										<tbody>
											{tvls.map((chainTvl) => (
												<tr key={chainTvl[0]}>
													<th>{capitalizeFirstLetter(chainTvl[0])}</th>
													<td>{formattedNum(chainTvl[1] || 0, true)}</td>
												</tr>
											))}
										</tbody>
									</DetailsTable>
								)}

								{extraTvls.length > 0 && (
									<DetailsTable>
										<thead>
											<tr>
												<th>Include in TVL (optional)</th>
												<td className="question-helper">
													<QuestionHelper text='People define TVL differently. Instead of being opinionated, we give you the option to choose what you would include in a "real" TVL calculation' />
												</td>
											</tr>
										</thead>
										<tbody>
											{extraTvls.map(([option, value]) => (
												<tr key={option}>
													<th>
														<ExtraOption>
															<Checkbox2
																type="checkbox"
																value={option}
																checked={extraTvlsEnabled[option]}
																onChange={updater(option)}
															/>
															<span style={{ opacity: extraTvlsEnabled[option] ? 1 : 0.7 }}>
																{capitalizeFirstLetter(option)}
															</span>
														</ExtraOption>
													</th>
													<td>{formattedNum(value, true)}</td>
												</tr>
											))}
										</tbody>
									</DetailsTable>
								)}
							</span>
						</Details>
					)}

					{mcap === 'true' && tokenMcap ? (
						<Stat>
							<span>Market Cap</span>
							<span>{formattedNum(tokenMcap, true)}</span>
						</Stat>
					) : null}

					{tokenPrice === 'true' && priceOfToken ? (
						<Stat>
							<span>Token Price</span>
							<span>{formattedNum(priceOfToken, true)}</span>
						</Stat>
					) : null}

					{fdv === 'true' && tokenSupply && priceOfToken ? (
						<Stat>
							<span>Fully Diluted Valuation</span>
							<span>{formattedNum(priceOfToken * tokenSupply, true)}</span>
						</Stat>
					) : null}

					{volume === 'true' && allTimeVolume ? (
						<Stat>
							<span>Total Volume</span>
							<span>{formattedNum(allTimeVolume, true)}</span>
						</Stat>
					) : null}

					{volume === 'true' && dailyVolume ? (
						<Stat>
							<span>Volume 24h</span>
							<span>{formattedNum(dailyVolume, true)}</span>
						</Stat>
					) : null}

					{fees === 'true' && allTimeFees ? (
						<Stat>
							<span>Total Fees</span>
							<span>{formattedNum(allTimeFees, true)}</span>
						</Stat>
					) : null}

					{fees === 'true' && dailyFees ? (
						<Stat>
							<span>Fees 24h</span>
							<span>{formattedNum(dailyFees, true)}</span>
						</Stat>
					) : null}

					{revenue === 'true' && dailyRevenue ? (
						<Stat>
							<span>Revenue 24h</span>
							<span>{formattedNum(dailyRevenue, true)}</span>
						</Stat>
					) : null}

					{activeUsers === 'true' && users?.users ? (
						<Stat>
							<span>Users 24h</span>
							<span>{formattedNum(users.users, false)}</span>
						</Stat>
					) : null}
				</DetailsWrapper>

				<ProtocolChart
					protocol={protocol}
					color={backgroundColor}
					historicalChainTvls={historicalChainTvls}
					chains={chains}
					hallmarks={hallmarks}
					bobo={bobo}
					geckoId={gecko_id}
					chartColors={chartColors}
					metrics={metrics}
					emissions={emissions?.chartData}
					unlockTokenSymbol={emissions?.tokenPrice?.symbol}
					activeUsersId={users ? protocolData.id : null}
				/>

				<Bobo onClick={() => setBobo(!bobo)}>
					<span className="visually-hidden">Enable Goblin Mode</span>
					<Image src={boboLogo} width="34px" height="34px" alt="bobo cheers" />
				</Bobo>
			</StatsSection>

			<SectionHeader>Information</SectionHeader>
			<InfoWrapper>
				<Section>
					<h3>{isCEX ? 'Exchange Information' : 'Protocol Information'}</h3>
					{description && <p>{description}</p>}

					{category && (
						<FlexRow>
							<span>Category</span>
							<span>: </span>
							<Link href={category.toLowerCase() === 'cex' ? '/cexs' : `/protocols/${category.toLowerCase()}`}>
								{category}
							</Link>
						</FlexRow>
					)}

					{forkedFrom && forkedFrom.length > 0 && (
						<FlexRow>
							<span>Forked from</span>
							<span>:</span>
							<>
								{forkedFrom.map((p, index) => (
									<Link href={`/protocol/${slug(p)}`} key={p}>
										{forkedFrom[index + 1] ? p + ', ' : p}
									</Link>
								))}
							</>
						</FlexRow>
					)}

					{audits && audit_links && <AuditInfo audits={audits} auditLinks={audit_links} color={backgroundColor} />}

					<LinksWrapper>
						{url && (
							<Link href={url} passHref>
								<Button as="a" target="_blank" rel="noopener" useTextColor={true} color={backgroundColor}>
									<span>Website</span> <ArrowUpRight size={14} />
								</Button>
							</Link>
						)}

						{twitter && (
							<Link href={`https://twitter.com/${twitter}`} passHref>
								<Button as="a" target="_blank" rel="noopener noreferrer" useTextColor={true} color={backgroundColor}>
									<span>Twitter</span> <ArrowUpRight size={14} />
								</Button>
							</Link>
						)}
					</LinksWrapper>
				</Section>

				{articles.length > 0 && (
					<Section>
						<RowBetween>
							<h3>Latest from DL News</h3>
							<Link href="https://www.dlnews.com" passHref>
								<a>
									<DLNewsLogo width={102} height={22} />
								</a>
							</Link>
						</RowBetween>

						{articles.map((article, idx) => (
							<NewsCard key={`news_card_${idx}`} {...article} color={backgroundColor} />
						))}
					</Section>
				)}

				{(address || protocolData.gecko_id || blockExplorerLink) && (
					<Section>
						<h3>Token Information</h3>

						{address && (
							<FlexRow>
								<span>Address</span>
								<span>:</span>
								<span>{address.split(':').pop().slice(0, 8) + '...' + address?.slice(36, 42)}</span>
								<CopyHelper toCopy={address.split(':').pop()} disabled={!address} />
							</FlexRow>
						)}

						<LinksWrapper>
							{protocolData.gecko_id && (
								<Link href={`https://www.coingecko.com/en/coins/${protocolData.gecko_id}`} passHref>
									<Button as="a" target="_blank" rel="noopener noreferrer" useTextColor={true} color={backgroundColor}>
										<span>View on CoinGecko</span> <ArrowUpRight size={14} />
									</Button>
								</Link>
							)}

							{blockExplorerLink && (
								<Link href={blockExplorerLink} passHref>
									<Button as="a" target="_blank" rel="noopener noreferrer" useTextColor={true} color={backgroundColor}>
										<span>View on {blockExplorerName}</span> <ArrowUpRight size={14} />
									</Button>
								</Link>
							)}
						</LinksWrapper>
					</Section>
				)}

				{(methodology || codeModule) && (
					<Section>
						<h3>Methodology</h3>
						{methodology && <p>{methodology}</p>}
						<LinksWrapper>
							{codeModule && (
								<Link
									href={`https://github.com/DefiLlama/DefiLlama-Adapters/tree/main/projects/${codeModule}`}
									passHref
								>
									<Button as="a" target="_blank" rel="noopener noreferrer" useTextColor={true} color={backgroundColor}>
										<span>Check the code</span>
										<ArrowUpRight size={14} />
									</Button>
								</Link>
							)}
						</LinksWrapper>
					</Section>
				)}

				{similarProtocols && similarProtocols.length > 0 ? (
					<Section>
						<h3>Competitors</h3>

						<LinksWrapper>
							{similarProtocols.map((similarProtocol) => (
								<Link href={`/protocol/${slug(similarProtocol.name)}`} passHref key={similarProtocol.name}>
									<a target="_blank" style={{ textDecoration: 'underline' }}>{`${similarProtocol.name} ($${toK(
										similarProtocol.tvl
									)})`}</a>
								</Link>
							))}
						</LinksWrapper>
					</Section>
				) : null}

				{raises && raises.length > 0 && (
					<Section>
						<h3>Raises</h3>
						<RaisesWrapper>
							<li>{`Total raised: ${formatRaisedAmount(raises.reduce((sum, r) => sum + Number(r.amount), 0))}`}</li>
							{raises
								.sort((a, b) => a.date - b.date)
								.map((raise) => (
									<li key={raise.date + raise.amount}>
										<a target="_blank" rel="noopener noreferrer" href={raise.source}>
											{formatRaise(raise)}
										</a>
									</li>
								))}
						</RaisesWrapper>
					</Section>
				)}

				{treasury && <Treasury protocolName={protocol} />}

				{emissions?.chartData?.length > 0 ? <Emissions data={emissions} /> : null}
			</InfoWrapper>

			{yeildsNumber > 0 && (
				<InfoWrapper>
					<Section>
						<h3>Yields</h3>

						<FlexRow>
							<span>Number of pools tracked</span>
							<span>:</span>
							<span>{yeildsNumber}</span>
						</FlexRow>
						<FlexRow>
							<span>Average APY</span>
							<span>:</span>
							<span>{averageApy.toFixed(2)}%</span>
						</FlexRow>

						<LinksWrapper>
							<Link href={`/yields?project=${protocol}`} passHref>
								<Button as="a" target="_blank" rel="noopener noreferrer" useTextColor={true} color={backgroundColor}>
									<span>Open on Yields dashboard</span> <ArrowUpRight size={14} />
								</Button>
							</Link>
						</LinksWrapper>
					</Section>
				</InfoWrapper>
			)}

			{showCharts && (
				<>
					<SectionHeader>{isCEX ? 'Total Assets Charts' : 'TVL Charts'}</SectionHeader>

					<ChartsWrapper>
						{loading ? (
							<ChartsPlaceholder>Loading...</ChartsPlaceholder>
						) : (
							<>
								{chainsSplit && chainsUnique?.length > 1 && (
									<LazyChart>
										<AreaChart
											chartData={chainsSplit}
											title="Chains"
											customLegendName="Chain"
											customLegendOptions={chainsUnique}
											valueSymbol="$"
										/>
									</LazyChart>
								)}
								{tokenBreakdown?.length > 1 && tokensUnique?.length > 1 && (
									<LazyChart>
										<AreaChart
											chartData={tokenBreakdown}
											title="Tokens"
											customLegendName="Token"
											customLegendOptions={tokensUnique}
										/>
									</LazyChart>
								)}
								{tokenBreakdownUSD?.length > 1 && tokensUnique?.length > 1 && (
									<>
										{tokenBreakdownPieChart.length > 0 && (
											<LazyChart>
												<PieChart title="Tokens Breakdown" chartData={tokenBreakdownPieChart} />
											</LazyChart>
										)}

										<LazyChart>
											<AreaChart
												chartData={tokenBreakdownUSD}
												title="Tokens (USD)"
												customLegendName="Token"
												customLegendOptions={tokensUnique}
												valueSymbol="$"
											/>
										</LazyChart>
									</>
								)}
								{usdInflows && (
									<LazyChart>
										<BarChart chartData={usdInflows} color={backgroundColor} title="USD Inflows" valueSymbol="$" />
									</LazyChart>
								)}
								{tokenInflows && (
									<LazyChart>
										<BarChart
											chartData={tokenInflows}
											title="Token Inflows"
											customLegendName="Token"
											customLegendOptions={tokensUnique}
											hideDefaultLegend={true}
											valueSymbol="$"
										/>
									</LazyChart>
								)}
							</>
						)}
					</ChartsWrapper>
				</>
			)}

			<ProtocolFeesAndRevenueCharts data={protocolData} />
		</Layout>
	)
}

export default ProtocolContainer
