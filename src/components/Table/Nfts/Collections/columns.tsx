import { ColumnDef } from '@tanstack/react-table'
import { CustomLink } from '~/components/Link'
import TokenLogo from '~/components/TokenLogo'
import { nftCollectionIconUrl, slug, formattedPercent } from '~/utils'
import { Name } from '../../shared'
import type { INftCollection } from '../types'

export const columns: ColumnDef<INftCollection>[] = [
	{
		header: 'Name',
		accessorKey: 'name',
		enableSorting: false,
		cell: ({ row }) => {
			const item = row.original

			return (
				<Name>
					<TokenLogo logo={nftCollectionIconUrl(item.collectionId)} fallbackLogo={item?.image} external />
					<CustomLink href={`/nfts/collection/${slug(item.collectionId)}`}>{`${item.name}`}</CustomLink>
				</Name>
			)
		},
		size: 200
	},
	{
		header: 'Floor Price',
		accessorKey: 'floorPrice',
		size: 120,
		cell: (info) => info.getValue() + ' ETH',
		meta: {
			align: 'end'
		}
	},
	{
		header: '1d Change',
		accessorKey: 'floorPricePctChange1Day',
		size: 120,
		cell: (info) => formattedPercent(info.getValue()),
		meta: {
			align: 'end'
		}
	},
	{
		header: '7d Change',
		accessorKey: 'floorPricePctChange7Day',
		size: 120,
		cell: (info) => formattedPercent(info.getValue()),
		meta: {
			align: 'end'
		}
	},
	{
		header: 'Volume 1d',
		accessorKey: 'volume1d',
		size: 120,
		cell: (info) => <>{info.getValue() ? info.getValue() + ' ETH' : ''}</>,

		meta: {
			align: 'end'
		}
	},
	{
		header: 'Volume 7d',
		accessorKey: 'volume7d',
		size: 120,
		cell: (info) => <>{info.getValue() ? info.getValue() + ' ETH' : ''}</>,

		meta: {
			align: 'end'
		}
	},
	{
		header: 'Total Supply',
		accessorKey: 'totalSupply',
		size: 120,
		meta: {
			align: 'end'
		}
	},
	{
		header: 'On Sale',
		accessorKey: 'onSaleCount',
		size: 120,
		meta: {
			align: 'end'
		}
	}
	// {
	// 	header: 'Chains',
	// 	accessorKey: 'chains',
	// 	enableSorting: false,
	// 	cell: (info) => {
	// 		const values = info.getValue() as Array<string>
	// 		return <IconsRow links={values.map((x) => capitalizeFirstLetter(x))} url="/nfts/chain" iconType="chain" />
	// 	},
	// 	meta: {
	// 		align: 'end'
	// 	},
	// 	size: 120
	// },
	// {
	// 	header: 'MarketPlaces',
	// 	accessorKey: 'marketplaces',
	// 	enableSorting: false,
	// 	cell: (info) => {
	// 		const values = info.getValue() as Array<string>

	// 		return <IconsRow links={values.map((x) => capitalizeFirstLetter(x))} url="/nfts/marketplace" iconType="token" />
	// 	},
	// 	meta: {
	// 		align: 'end'
	// 	},
	// 	size: 120
	// },
	// {
	// 	header: 'Daily Volume',
	// 	accessorKey: 'dailyVolumeUSD',
	// 	enableSorting: true,
	// 	cell: ({ getValue }) => {
	// 		return <>{getValue() <= 0 ? '--' : formattedNum(getValue(), true)}</>
	// 	},
	// 	meta: {
	// 		align: 'end'
	// 	},
	// 	size: 120
	// },
	// {
	// 	header: 'Total Volume',
	// 	accessorKey: 'totalVolumeUSD',
	// 	enableSorting: true,
	// 	cell: ({ getValue }) => {
	// 		return <>{getValue() <= 0 ? '--' : formattedNum(getValue(), true)}</>
	// 	},
	// 	meta: {
	// 		align: 'end'
	// 	},
	// 	size: 120
	// },
	// {
	// 	header: 'Floor',
	// 	accessorKey: 'floor',
	// 	enableSorting: true,
	// 	cell: ({ getValue }) => {
	// 		return <>{getValue() <= 0 ? '--' : formattedNum(getValue(), true)}</>
	// 	},
	// 	meta: {
	// 		align: 'end'
	// 	},
	// 	size: 120
	// },
	// {
	// 	header: 'Owners',
	// 	accessorKey: 'owners',
	// 	enableSorting: true,
	// 	cell: ({ getValue }) => {
	// 		return <>{getValue() <= 0 ? '--' : formattedNum(getValue(), false)}</>
	// 	},
	// 	meta: {
	// 		align: 'end'
	// 	},
	// 	size: 120
	// }
]
