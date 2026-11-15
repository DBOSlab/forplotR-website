--[[
  lang.lua: uma fonte, duas línguas.

  As páginas são escritas uma vez, com os trechos de cada língua marcados:
    [texto]{data-lang=pt}[text]{data-lang=en}      (em linha)
    ::: {data-lang="pt"} ... :::                    (blocos)
    <span data-lang="en">...</span>                 (HTML bruto)

  A página em português (/) e a página em inglês (/en/) incluem o mesmo corpo;
  este filtro mantém só a língua da página (metadado `lang`) e remove a outra.
  Assim o HTML publicado tem uma língua só (bom para leitores de tela, busca e
  indexação) e as duas versões nunca divergem.
]]

local target = 'pt'

-- Remove do HTML bruto cada elemento marcado com a outra língua, respeitando
-- elementos aninhados com o mesmo nome (<span><span>..</span></span>).
local function strip_raw(text)
  local other = target == 'en' and 'pt' or 'en'
  local out, pos = {}, 1
  while true do
    local s, e, tag = text:find('<(%w+)[^>]-%sdata%-lang="' .. other .. '"[^>]->', pos)
    if not s then break end
    table.insert(out, text:sub(pos, s - 1))
    -- elemento vazio (sem fechamento) ou autocontido
    local void = { img = true, br = true, hr = true, input = true, source = true, meta = true, link = true, wbr = true }
    if text:sub(e - 1, e) == '/>' or void[tag:lower()] then
      pos = e + 1
    else
      local depth, i = 1, e + 1
      while depth > 0 do
        local o1, o2 = text:find('<' .. tag .. '[%s>]', i)
        local c1, c2 = text:find('</' .. tag .. '%s*>', i)
        if not c1 then i = #text + 1; break end
        if o1 and o1 < c1 then depth = depth + 1; i = o2 + 1
        else depth = depth - 1; i = c2 + 1 end
      end
      pos = i
    end
  end
  table.insert(out, text:sub(pos))
  local res = table.concat(out)
  -- a língua da página: só tira o marcador
  res = res:gsub('%sdata%-lang="' .. target .. '"', '')
  return res
end

local function keep(el)
  local l = el.attributes and el.attributes['data-lang']
  if l == nil then return nil end
  if l ~= target then return {} end
  el.attributes['data-lang'] = nil
  if #el.classes == 0 and #el.identifier == 0 and #el.attributes == 0 then
    return el.content
  end
  return el
end

return {
  {
    Meta = function(m)
      local l = m.lang and pandoc.utils.stringify(m.lang) or 'pt'
      target = l:match('^en') and 'en' or 'pt'
    end
  },
  {
    Span = keep,
    Div = keep,
    RawBlock = function(el)
      if el.format == 'html' then el.text = strip_raw(el.text); return el end
    end,
    RawInline = function(el)
      if el.format == 'html' then el.text = strip_raw(el.text); return el end
    end,
    -- títulos e descrições no YAML também podem ser bilíngues
    Meta = function(m)
      for _, k in ipairs({ 'title', 'subtitle', 'description', 'pagetitle', 'kicker' }) do
        if m[k] and pandoc.utils.type(m[k]) == 'Inlines' then
          local walked = pandoc.Span(m[k]):walk({ Span = keep })
          m[k] = walked.content
        end
      end
      return m
    end
  }
}
