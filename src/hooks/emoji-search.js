import { useEffect, useState } from 'react'
import data from '@emoji-mart/data'
import { init, SearchIndex } from 'emoji-mart'

// Initialize emoji data
init({ data })

const useEmojiSearch = () => {
  const [searchIndex, setSearchIndex] = useState(null)

  useEffect(() => {
    // Initialize the search index once when the component mounts
    setSearchIndex(SearchIndex)
  }, [])

  // The search function that returns the first emoji or a fallback
  const emojiSearch = async (searchValue) => {
    if (!searchValue || !searchIndex) return '❓' // Fallback if no search term or index is available

    const emojis = await searchIndex.search(searchValue)

    if (emojis && emojis.length > 0) {
      return emojis[0].skins[0].native // Return the first matching emoji
    }

    return '❓' // Fallback if no matches are found
  }

  return { emojiSearch }
}

export default useEmojiSearch
