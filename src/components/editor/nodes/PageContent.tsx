import { Group, Rect } from 'react-konva'
import type { Page, PageFormat } from '../../../types'
import { ElementNode, type NodeProps } from './ElementNode'

interface Props {
  page: Page
  format: PageFormat
  interactive?: boolean
  nodeProps?: (id: string) => Partial<NodeProps>
  /** Exportar con fondo transparente (PNG): no se pinta el color de la página. */
  transparent?: boolean
}

/** Contenido de una página. Se reutiliza en el editor y en la exportación. */
export function PageContent({ page, format, interactive = false, nodeProps, transparent = false }: Props) {
  return (
    <Group clipX={0} clipY={0} clipWidth={format.width} clipHeight={format.height}>
      <Rect name="page-bg" width={format.width} height={format.height} fill={transparent ? undefined : page.background} listening={interactive} />
      {page.elements.map((el) => (
        <ElementNode key={el.id} el={el} interactive={interactive} {...nodeProps?.(el.id)} />
      ))}
    </Group>
  )
}
