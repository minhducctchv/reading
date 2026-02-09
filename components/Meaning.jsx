'use client'

import { useState } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'

export function Meaning({ word, meaning }) {
    const [open, setOpen] = useState(false)

    return (
        <Tooltip.Provider delayDuration={0}>
            <Tooltip.Root open={open} onOpenChange={setOpen}>
                <Tooltip.Trigger asChild>
                    <span
                        className="cursor-pointer bg-green-50 dark:bg-yellow-900/15 rounded px-0.5"
                        onClick={() => setOpen((prev) => !prev)}
                    >
                        {word}
                    </span>
                </Tooltip.Trigger>

                <Tooltip.Portal>
                    <Tooltip.Content
                        className="rounded px-3 py-2 text-sm shadow bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700"
                        sideOffset={5}
                    >
                        {meaning}
                        <Tooltip.Arrow className="fill-white dark:fill-neutral-800" />
                    </Tooltip.Content>
                </Tooltip.Portal>
            </Tooltip.Root>
        </Tooltip.Provider>
    )
}
