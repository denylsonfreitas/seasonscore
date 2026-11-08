import { Select } from "@chakra-ui/react";
import { TV_GENRES_PT } from "../../utils/genres";

export interface SeriesFilterProps {
  genreFilter: string;
  onGenreChange: (genre: string, name?: string) => void;
}

// Lista de gêneros e seus IDs
const genres = [
  { id: "", name: "Todos os gêneros" },
  ...[18, 35, 80, 10759, 10765, 9648, 99, 16, 10751, 10768, 10766, 10762, 10764, 10767].map(
    (id) => ({ id: String(id), name: TV_GENRES_PT[id] })
  ),
];

export function SeriesFilter({ genreFilter, onGenreChange }: SeriesFilterProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedGenreId = e.target.value;
    const selectedGenre = genres.find((genre) => genre.id === selectedGenreId);
    onGenreChange(selectedGenreId, selectedGenre?.name);
  };

  return (
    <Select
      id="genre-filter"
      name="genre-filter"
      value={genreFilter}
      onChange={handleChange}
      placeholder="Filtrar por gênero"
      sx={{
        option: {
          bg: "ink.850",
          color: "ink.100",
        },
      }}
    >
      {genres.map((genre) => (
        <option key={genre.id} value={genre.id}>
          {genre.name}
        </option>
      ))}
    </Select>
  );
}
