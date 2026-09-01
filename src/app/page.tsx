'use client'

import { useCards } from '@/hooks/useCards'
import { Card } from '@/components/Card'
import { CardDeck } from '@/components/CardDeck'

export default function HomePage() {
  const {
    cards,
    activeId,
    setActiveId,
    setTaskText,
    toggleDone,
    toggleImportant,
    setCardMeta,
    addCard,
    deleteCard,
  } = useCards()

  return (
    <CardDeck
      activeId={activeId}
      onActiveChange={setActiveId}
      onAddCard={addCard}
      onDeleteCard={deleteCard}
      items={cards.map(card => ({
        key: card.id,
        content: (
          <Card
            card={card}
            onMeta={patch => setCardMeta(card.id, patch)}
            onText={(i, text) => setTaskText(card.id, i, text)}
            onToggleDone={i => toggleDone(card.id, i)}
            onToggleImportant={i => toggleImportant(card.id, i)}
          />
        ),
      }))}
    />
  )
}
