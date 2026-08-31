'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CARD_KINDS, CardKind } from '@/lib/types'
import { useCards } from '@/hooks/useCards'
import { Card } from '@/components/Card'
import { CardDeck } from '@/components/CardDeck'
import { MigrationDrawer } from '@/components/MigrationDrawer'
import { hasLegacyData, readLegacyBuckets, clearLegacyData } from '@/lib/legacyMigration'

export default function HomePage() {
  const { cards, setTaskText, toggleDone, toggleImportant, setCardMeta, importTexts } = useCards()
  const [migrateOpen, setMigrateOpen] = useState(false)

  useEffect(() => {
    const b = readLegacyBuckets()
    const total = b.today.length + b.daily.length + b.weekly.length
    if (total > 0) setMigrateOpen(true)
    else if (hasLegacyData()) clearLegacyData() // stray non-task legacy keys — drop silently
  }, [])

  const handleToggleDone = (kind: CardKind, i: number) => {
    const nowDone = toggleDone(kind, i)
    if (nowDone) {
      toast('Task completed', {
        action: { label: 'Undo', onClick: () => toggleDone(kind, i) },
      })
    }
  }

  return (
    <>
      <CardDeck
        items={CARD_KINDS.map(kind => ({
          key: kind,
          content: (
            <Card
              kind={kind}
              card={cards[kind]}
              onMeta={patch => setCardMeta(kind, patch)}
              onText={(i, text) => setTaskText(kind, i, text)}
              onToggleDone={i => handleToggleDone(kind, i)}
              onToggleImportant={i => toggleImportant(kind, i)}
            />
          ),
        }))}
      />

      <MigrationDrawer open={migrateOpen} onOpenChange={setMigrateOpen} onImport={importTexts} />
    </>
  )
}
