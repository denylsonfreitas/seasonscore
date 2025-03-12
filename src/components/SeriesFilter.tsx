import { Select } from "@chakra-ui/react";

export interface SeriesFilterProps {
  genreFilter: string;
  onGenreChange: (genre: string) => void;
}

export function SeriesFilter({
  genreFilter,
  onGenreChange,
}: SeriesFilterProps) {
  return (
    <Select
      value={genreFilter}
      onChange={(e) => onGenreChange(e.target.value)}
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
      <option value="">Todos os gêneros</option>
      <option value="18">Drama</option>
      <option value="35">Comédia</option>
      <option value="80">Crime</option>
      <option value="10759">Ação & Aventura</option>
      <option value="10765">Ficção Científica & Fantasia</option>
      <option value="10767">Talk Show</option>
      <option value="10764">Reality</option>
      <option value="99">Documentário</option>
      <option value="10768">Guerra & Política</option>
      <option value="10766">Novela</option>
      <option value="10762">Infantil</option>
      <option value="9648">Mistério</option>
    </Select>
  );
}
