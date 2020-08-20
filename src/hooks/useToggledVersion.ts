// import useParsedQueryString from './useParsedQueryString'

export enum Version {
  v1 = 'v1',
}

export const DEFAULT_VERSION: Version = Version.v1

export default function useToggledVersion(): Version {
  // const { use } = useParsedQueryString()
  // if (!use || typeof use !== 'string') return Version.v2
  // if (use.toLowerCase() === 'v1') return Version.v1
  return DEFAULT_VERSION
}
