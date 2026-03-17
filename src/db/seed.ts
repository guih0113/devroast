import { createHash } from 'node:crypto'
import { faker } from '@faker-js/faker'
import { db } from './index'
import { analysisItems, roasts } from './schema'
import { ANALYSIS_POOL } from './seed/analysis'
import { makeDiff } from './seed/make-diff'
import { ROAST_QUOTES } from './seed/quotes'
import { CODE_SNIPPETS, LANGS } from './seed/snippets'

const ROAST_COUNT = 100

async function seed() {
  console.log('Seeding database...')

  await db.delete(analysisItems)
  await db.delete(roasts)
  console.log('Cleared existing data.')

  for (let i = 0; i < ROAST_COUNT; i++) {
    const lang = faker.helpers.arrayElement(LANGS)
    const snippet = faker.helpers.arrayElement(CODE_SNIPPETS[lang])
    const score = faker.number.float({ min: 0.5, max: 9.5, fractionDigits: 2 })
    const codeHash = createHash('sha256').update(snippet.code.trim()).digest('hex')

    const [roast] = await db
      .insert(roasts)
      .values({
        code: snippet.code,
        codeHash,
        lang,
        fileName: snippet.fileName,
        score: String(score),
        roastQuote: faker.helpers.arrayElement(ROAST_QUOTES),
        issuesFound: faker.number.int({ min: 1, max: 20 }),
        errors: faker.number.int({ min: 0, max: 5 }),
        roastMode: faker.datatype.boolean(),
        diff: makeDiff(snippet.code),
        createdAt: faker.date.between({
          from: new Date('2025-01-01'),
          to: new Date()
        })
      })
      .returning({ id: roasts.id })

    const shuffled = faker.helpers.shuffle([...ANALYSIS_POOL])
    const picked = shuffled.slice(0, faker.number.int({ min: 3, max: 5 }))

    await db.insert(analysisItems).values(
      picked.map((item, position) => ({
        roastId: roast.id,
        severity: item.severity,
        title: item.title,
        description: item.description,
        position
      }))
    )

    process.stdout.write(`\r  ${i + 1}/${ROAST_COUNT} roasts inserted`)
  }

  console.log('\nDone.')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
