"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover"
import axiosInstance from "@/lib/axiosInstance"

type ItemTemplate = {
  id: number
  description: string
  unit_price: string // renvoyé en string par l'API (decimal Laravel)
  vat_rate: string
}

type Props = {
  value: string
  onChange: (description: string) => void
  onSelectTemplate: (template: { description: string; unit_price: number; vat_rate: number }) => void
  placeholder?: string
  className?: string
}

export function DescriptionAutocomplete({
  value,
  onChange,
  onSelectTemplate,
  placeholder,
  className,
}: Props) {
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<ItemTemplate[]>([])

  // Débounce : on attend 250ms après la dernière frappe avant d'appeler l'API
  useEffect(() => {
    if (!value || value.trim().length < 2) {
      setSuggestions([])
      return
    }

    const timeout = setTimeout(async () => {
      try {
        const res = await axiosInstance.get("/item-templates", {
          params: { search: value },
        })
        setSuggestions(res.data.data)
        setOpen(res.data.data.length > 0)
      } catch (error) {
        console.error(error)
      }
    }, 250)

    return () => clearTimeout(timeout)
  }, [value])

  const handleSelect = (template: ItemTemplate) => {
    onChange(template.description)
    onSelectTemplate({
      description: template.description,
      unit_price: Number(template.unit_price),
      vat_rate: Number(template.vat_rate),
    })
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Input
          placeholder={placeholder ?? "Description"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          // léger délai pour laisser le clic sur une suggestion se déclencher avant la fermeture
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className={className}
        />
      </PopoverAnchor>
      <PopoverContent
        className="w-[300px] p-0"
        align="start"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandList>
            <CommandGroup heading="Descriptions déjà utilisées">
              {suggestions.map((template) => (
                <CommandItem
                  key={template.id}
                  value={template.description}
                  onSelect={() => handleSelect(template)}
                  className="flex items-center justify-between"
                >
                  <span>{template.description}</span>
                  <span className="text-muted-foreground text-xs">
                    {Number(template.unit_price).toLocaleString("fr-FR")} XOF
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}