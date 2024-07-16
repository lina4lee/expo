import { useEffect, useMemo, useState } from 'react';
import { useBlurhash } from '../utils/blurhash/useBlurhash';
import { isThumbhashString } from '../utils/resolveSources';
import { thumbHashStringToDataURL } from '../utils/thumbhash/thumbhash';
export function useThumbhash(source) {
    const isThumbhash = isThumbhashString(source?.uri || '');
    const strippedThumbhashString = source?.uri?.replace(/thumbhash:\//, '') ?? '';
    const thumbhashSource = useMemo(() => (isThumbhash ? { uri: thumbHashStringToDataURL(strippedThumbhashString) } : null), [strippedThumbhashString, isThumbhash]);
    return [thumbhashSource, isThumbhash];
}
export function useImageHashes(source) {
    const [thumbhash, isThumbhashString] = useThumbhash(source);
    const [blurhash, isBlurhashString] = useBlurhash(source);
    return useMemo(() => {
        if (!isThumbhashString && !isBlurhashString) {
            return { resolvedSource: source, isImageHash: false };
        }
        if (!blurhash && !thumbhash) {
            return { resolvedSource: null, isImageHash: true };
        }
        return {
            resolvedSource: blurhash ?? thumbhash,
            isImageHash: true,
        };
    }, [blurhash, thumbhash, isThumbhashString, isBlurhashString, source]);
}
export function useHeaders(source, cachePolicy, onError) {
    const [objectURL, setObjectURL] = useState(null);
    useEffect(() => {
        (async () => {
            if (!source?.headers || !source.uri) {
                return;
            }
            try {
                const result = await fetch(source.uri, {
                    headers: source.headers,
                    cache: cachePolicy === 'none' ? 'no-cache' : 'default',
                    redirect: 'follow',
                });
                if (!result.ok) {
                    throw new Error(`Failed to fetch image: ${result.status} ${result.statusText}`);
                }
                const blob = await result.blob();
                setObjectURL((prevObjURL) => {
                    if (prevObjURL) {
                        URL.revokeObjectURL(prevObjURL);
                    }
                    return URL.createObjectURL(blob);
                });
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            }
            catch (error) {
                onError?.forEach((e) => e?.({ source }));
            }
        })();
    }, [source]);
    if (!source?.headers) {
        return source;
    }
    if (!objectURL) {
        // Avoid fetching a URL without headers if we have headers
        return null;
    }
    return { ...source, uri: objectURL };
}
//# sourceMappingURL=hooks.js.map