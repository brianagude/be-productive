'use client'

import { useEffect, useState } from 'react'
import { useCards } from '@/hooks/useCards'
import { Card } from '@/components/Card'
import { CardDeck } from '@/components/CardDeck'
import { MigrationDrawer } from '@/components/MigrationDrawer'
import { hasLegacyData, readLegacyTasks, clearLegacyData } from '@/lib/legacyMigration'

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
    importTasks,
  } = useCards()
  const [migrateOpen, setMigrateOpen] = useState(false)

  useEffect(() => {
    if (readLegacyTasks().length > 0) setMigrateOpen(true)
    else if (hasLegacyData()) clearLegacyData() // stray non-task legacy keys — drop silently
  }, [])

  return (
    <>
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

      <MigrationDrawer open={migrateOpen} onOpenChange={setMigrateOpen} onImport={importTasks} />
    </>
  )
}
