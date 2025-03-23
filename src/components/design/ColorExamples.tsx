import {
  Box,
  Button,
  Heading,
  VStack,
  Text,
  HStack,
  Divider,
  Badge,
  Tag,
  Switch,
  Checkbox,
  Radio,
  IconButton,
  useColorModeValue,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Progress,
  Input,
  Textarea,
  Select,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
} from "@chakra-ui/react";
import { PlusCircle, Heart, ThumbsUp, Share } from "@phosphor-icons/react";

/**
 * Componente que demonstra exemplos de uso do sistema de cores em vários componentes Chakra UI
 */
export function ColorExamples() {
  return (
    <VStack spacing={10} align="stretch" p={6}>
      <Heading as="h1" size="xl" mb={4}>
        Exemplos de Uso do Sistema de Cores
      </Heading>
      
      <Text fontSize="lg" mb={4}>
        Estes exemplos mostram como aplicar a paleta de cores do SeasonScore em vários componentes.
      </Text>
      
      {/* Botões */}
      <Box>
        <Heading as="h2" size="md" mb={4}>
          Botões
        </Heading>
        <HStack spacing={4} mb={4}>
          <Button colorScheme="primary" size="md">Botão Principal</Button>
          <Button colorScheme="primary" variant="outline" size="md">Outline</Button>
          <Button colorScheme="primary" variant="ghost" size="md">Ghost</Button>
          <Button colorScheme="primary" variant="link" size="md">Link</Button>
        </HStack>
        <HStack spacing={4}>
          <Button bg="primary.500" color="white" _hover={{ bg: "primary.600" }}>
            Personalizado
          </Button>
          <Button bg="secondary.600" color="white" _hover={{ bg: "secondary.700" }}>
            Secundário
          </Button>
          <IconButton
            aria-label="Adicionar"
            icon={<PlusCircle weight="fill" />}
            colorScheme="primary"
          />
        </HStack>
      </Box>
      
      <Divider />
      
      {/* Indicadores */}
      <Box>
        <Heading as="h2" size="md" mb={4}>
          Indicadores e Estados
        </Heading>
        <HStack spacing={4} mb={4} wrap="wrap">
          <Badge colorScheme="primary">Badge</Badge>
          <Badge colorScheme="primary" variant="solid">Badge Solid</Badge>
          <Badge colorScheme="primary" variant="outline">Badge Outline</Badge>
          <Tag colorScheme="primary">Tag</Tag>
          <Tag colorScheme="primary" variant="solid">Tag Solid</Tag>
          <Tag colorScheme="primary" variant="outline">Tag Outline</Tag>
        </HStack>
        <HStack spacing={4} mb={4}>
          <Switch colorScheme="primary" defaultChecked />
          <Checkbox colorScheme="primary" defaultChecked>Checkbox</Checkbox>
          <Radio colorScheme="primary" defaultChecked>Radio</Radio>
        </HStack>
        <HStack spacing={4}>
          <Alert status="success" borderRadius="md" maxW="200px">
            <AlertIcon />
            Sucesso!
          </Alert>
          <Alert status="error" borderRadius="md" maxW="200px">
            <AlertIcon />
            Erro!
          </Alert>
          <Alert status="warning" borderRadius="md" maxW="200px">
            <AlertIcon />
            Atenção!
          </Alert>
          <Alert status="info" borderRadius="md" maxW="200px">
            <AlertIcon />
            Informação
          </Alert>
        </HStack>
      </Box>
      
      <Divider />
      
      {/* Navegação */}
      <Box>
        <Heading as="h2" size="md" mb={4}>
          Navegação
        </Heading>
        <Tabs variant="enclosed" colorScheme="primary" mb={4}>
          <TabList>
            <Tab>Aba 1</Tab>
            <Tab>Aba 2</Tab>
            <Tab>Aba 3</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <Text>Conteúdo da aba 1</Text>
            </TabPanel>
            <TabPanel>
              <Text>Conteúdo da aba 2</Text>
            </TabPanel>
            <TabPanel>
              <Text>Conteúdo da aba 3</Text>
            </TabPanel>
          </TabPanels>
        </Tabs>
        
        <Tabs variant="soft-rounded" colorScheme="primary">
          <TabList>
            <Tab>Aba 1</Tab>
            <Tab>Aba 2</Tab>
            <Tab>Aba 3</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <Text>Conteúdo da aba 1</Text>
            </TabPanel>
            <TabPanel>
              <Text>Conteúdo da aba 2</Text>
            </TabPanel>
            <TabPanel>
              <Text>Conteúdo da aba 3</Text>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
      
      <Divider />
      
      {/* Feedback */}
      <Box>
        <Heading as="h2" size="md" mb={4}>
          Feedback
        </Heading>
        <VStack spacing={4} align="stretch">
          <Progress value={80} colorScheme="primary" size="md" />
          <Progress value={40} colorScheme="primary" size="md" hasStripe />
          <Progress value={60} colorScheme="primary" size="md" hasStripe isAnimated />
        </VStack>
      </Box>
      
      <Divider />
      
      {/* Formulários */}
      <Box>
        <Heading as="h2" size="md" mb={4}>
          Formulários
        </Heading>
        <VStack spacing={4} align="stretch">
          <Input placeholder="Input com foco na cor primária" focusBorderColor="primary.500" />
          <Textarea placeholder="Textarea com foco na cor primária" focusBorderColor="primary.500" />
          <Select placeholder="Selecione uma opção" focusBorderColor="primary.500">
            <option value="option1">Opção 1</option>
            <option value="option2">Opção 2</option>
            <option value="option3">Opção 3</option>
          </Select>
        </VStack>
      </Box>
      
      <Divider />
      
      {/* Cards */}
      <Box>
        <Heading as="h2" size="md" mb={4}>
          Cards
        </Heading>
        <HStack spacing={6} align="flex-start" wrap="wrap">
          <Card maxW='sm' boxShadow="md" borderColor="primary.100" borderWidth="1px">
            <CardHeader bg="primary.500" color="white">
              <Heading size='md'>Card com Header Primário</Heading>
            </CardHeader>
            <CardBody>
              <Text>Exemplo de card utilizando a cor primária no header.</Text>
            </CardBody>
            <CardFooter
              justify='space-between'
              flexWrap='wrap'
              bg="gray.50"
              color="gray.800"
            >
              <Button flex='1' variant='ghost' leftIcon={<ThumbsUp />} colorScheme="primary">
                Curtir
              </Button>
              <Button flex='1' variant='ghost' leftIcon={<Heart />} colorScheme="primary">
                Favoritar
              </Button>
              <Button flex='1' variant='ghost' leftIcon={<Share />} colorScheme="primary">
                Compartilhar
              </Button>
            </CardFooter>
          </Card>
          
          <Card maxW='sm' boxShadow="md" borderColor="secondary.100" borderWidth="1px">
            <CardHeader bg="secondary.600" color="white">
              <Heading size='md'>Card com Header Secundário</Heading>
            </CardHeader>
            <CardBody>
              <Text>Exemplo de card utilizando a cor secundária no header.</Text>
            </CardBody>
            <CardFooter
              justify='space-between'
              flexWrap='wrap'
              bg="gray.50"
              color="gray.800"
            >
              <Button flex='1' variant='ghost' leftIcon={<ThumbsUp />} colorScheme="secondary">
                Curtir
              </Button>
              <Button flex='1' variant='ghost' leftIcon={<Heart />} colorScheme="secondary">
                Favoritar
              </Button>
              <Button flex='1' variant='ghost' leftIcon={<Share />} colorScheme="secondary">
                Compartilhar
              </Button>
            </CardFooter>
          </Card>
        </HStack>
      </Box>
      
      <Text fontSize="sm" color="gray.500" mt={4}>
        Consulte a documentação em src/styles/README.md para instruções detalhadas sobre como usar esse sistema de cores.
      </Text>
    </VStack>
  );
} 