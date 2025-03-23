# Sistema de Cores do SeasonScore

Este documento descreve como utilizar o sistema de cores centralizado do projeto SeasonScore.

## Cores Principais

O SeasonScore utiliza um sistema de cores centralizado para manter consistência visual em toda a aplicação. As cores principais são:

- **Primary**: `#04a777` - A cor principal da marca, usada em elementos de destaque, botões principais e ações importantes.
- **Secondary**: Tons de cinza para elementos secundários e de menor destaque.

## Cores de Reações

O sistema também possui cores dedicadas para reações do usuário:

- **Like**: `#FF101F` - Usado para reações positivas, curtidas e aprovações.
- **Dislike**: `#800020` - Usado para reações negativas e desaprovações.

## Como Usar

### Com Chakra UI

O sistema de cores é integrado ao Chakra UI através do tema personalizado. Use as referências de cor diretamente nos componentes:

```jsx
<Button colorScheme="primary">Botão Principal</Button>
<Text color="primary.500">Texto em cor primária</Text>
<Box bg="secondary.700">Fundo em cor secundária</Box>
```

Variantes disponíveis para cada cor (de mais claro para mais escuro):
- `50`, `100`, `200`, `300`, `400`, `500`, `600`, `700`, `800`, `900`

### Com CSS

Para componentes que não utilizam Chakra UI, você pode usar as variáveis CSS definidas em `colors.css`:

```css
.meu-elemento {
  background-color: var(--primary-500);
  color: var(--text-primary);
  border: 1px solid var(--secondary-300);
}
```

Ou usar as classes de utilidade:

```html
<div class="bg-primary text-secondary">Conteúdo</div>
<span class="text-primary border-secondary">Texto destacado</span>
```

## Cores de Estado

Além das cores primárias e secundárias, também temos cores para estados específicos:

- **Success**: `#38A169` - Para feedback positivo, confirmações e ações bem-sucedidas
- **Warning**: `#ECC94B` - Para alertas, avisos e situações que requerem atenção
- **Error**: `#E53E3E` - Para erros, falhas e situações críticas
- **Info**: `#3182CE` - Para informações e notificações neutras

## Boas Práticas

1. **Sempre use as referências do tema** ao invés de valores hexadecimais hardcoded
2. **Mantenha a consistência** usando as mesmas cores para elementos com funções similares
3. **Respeite a hierarquia visual** usando cores primárias para elementos de maior importância
4. **Considere a acessibilidade** ao escolher combinações de cores para texto e fundo

## Exemplo de Uso

Para botões de ação principal:
```jsx
<Button
  bg="primary.500"
  color="white"
  _hover={{ bg: "primary.600" }}
>
  Salvar
</Button>
```

Para elementos secundários:
```jsx
<Button
  bg="secondary.200"
  color="secondary.800"
  _hover={{ bg: "secondary.300" }}
>
  Cancelar
</Button>
``` 