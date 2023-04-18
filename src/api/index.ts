import useSWR from 'swr'
import { CG_TOKEN_API } from '~/constants/index'
import { arrayFetcher, fetcher, retrySWR } from '~/utils/useSWR'
import type { IResponseCGMarketsAPI } from './types'

function getCGMarketsDataURLs() {
	const urls: string[] = []
	const maxPage = 20
	for (let page = 1; page <= maxPage; page++) {
		urls.push(`${CG_TOKEN_API.replace('<PLACEHOLDER>', `${page}`)}`)
	}
	return urls
}

export const useFetchCoingeckoTokensList = () => {
	const { data, error } = useSWR<Array<IResponseCGMarketsAPI>>(
		'coingeckotokenslist',
		() => arrayFetcher(getCGMarketsDataURLs()),
		{
			onErrorRetry: retrySWR
		}
	)

	return {
		data: data?.flat(),
		error,
		loading: !data && !error
	}
}

export async function retryCoingeckoRequest(func, retries) {
	for (let i = 0; i < retries; i++) {
		try {
			const resp = await func()
			return resp
		} catch (e) {
			if ((i + 1) % 3 === 0 && retries > 3) {
				await new Promise((resolve) => setTimeout(resolve, 10e3))
			}
			continue
		}
	}
	return {}
}

export async function getAllCGTokensList(): Promise<
	Array<{ name: string; symbol?: string; image: string; image2: string }>
> {
	const data = await fetcher('https://defillama-datasets.llama.fi/tokenlist/sorted.json')

	return data
}

//:00 -> adapters start running, they take up to 15mins
//:20 -> storeProtocols starts running, sets cache expiry to :21 of next hour
//:22 -> we rebuild all pages
export function maxAgeForNext(minutesForRollover: number[] = [22]) {
	// minutesForRollover is an array of minutes in the hour that we want to revalidate
	const currentMinute = new Date().getMinutes()
	const currentSecond = new Date().getSeconds()
	const nextMinute = minutesForRollover.find((m) => m > currentMinute) ?? Math.min(...minutesForRollover) + 60
	const maxAge = nextMinute * 60 - currentMinute * 60 - currentSecond
	return maxAge
}
