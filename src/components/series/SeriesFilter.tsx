import { Select } from "@chakra-ui/react";

export interface SeriesFilterProps {
  genreFilter: string;
  onGenreChange: (genre: string, name?: string) => void;
}

// Lista de gêneros e seus IDs
const genres = [
  { id: "", name: "Todos os gêneros" },
  { id: "18", name: "Drama" },
  { id: "35", name: "Comédia" },
  { id: "80", name: "Crime" },
  { id: "10759", name: "Ação & Aventura" },
  { id: "10765", name: "Ficção Científica & Fantasia" },
  { id: "10767", name: "Talk Show" },
  { id: "10764", name: "Reality" },
  { id: "99", name: "Documentário" },
  { id: "10768", name: "Guerra & Política" },
  { id: "10766", name: "Novela" },
  { id: "10762", name: "Infantil" },
  { id: "9648", name: "Mistério" },
];

export function SeriesFilter({
  genreFilter,
  onGenreChange,
}: SeriesFilterProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedGenreId = e.target.value;
    const selectedGenre = genres.find(genre => genre.id === selectedGenreId);
    onGenreChange(selectedGenreId, selectedGenre?.name);
  };

  return (
    <Select
      value={genreFilter}
      onChange={handleChange}
      bg="gray.700"
      color="white"
      border="none"
      _hover={{ bg: "gray.600" }}
      placeholder="Filtrar por gênero"
      sx={{
        option: {
          bg: "gray.700",
          color: "white",
          _hover: {
            bg: "gray.600"
          }
        }
      }}
    >
      {genres.map(genre => (
        <option key={genre.id} value={genre.id}>
          {genre.name}
        </option>
      ))}
    </Select>
  );
}
