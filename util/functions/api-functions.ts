import axios from "axios";
import {
  ExternalIDsType,
  IMDBIDType,
  ImdbSeasonType,
  IMDBShowInfoType,
  OmdbEpisodeType,
  OmdbSeasonType,
  ResultType,
  SeasonType,
  ShowType,
} from "../types";
require("dotenv").config();

export const get_imdb_id = async (tmdb_id: string) => {
  const fetch_response = await axios.get(
    `${process.env.TMDB_URI}/tv/${tmdb_id}/external_ids?api_key=${process.env.TMDB_API_KEY}`
  );
  const data = fetch_response.data as ExternalIDsType;
  return data.imdb_id;
};
export const get_tmdb_id = async (imdb_id: string) => {
  const fetch_response = await axios.get(
    `${process.env.TMDB_URI}/find/${imdb_id}?api_key=${process.env.TMDB_API_KEY}&external_source=imdb_id`
  );
  const data = fetch_response.data as IMDBIDType;
  const tmdb_id = data.tv_results[0].id;
  return tmdb_id;
};
export const get_tmdb_show_info = async (tv_show_id: string) => {
  const fetch_response = await axios.get(
    `${process.env.TMDB_URI}/tv/${tv_show_id}?api_key=${process.env.TMDB_API_KEY}`
  );
  const data = fetch_response.data as ShowType;
  return data;
};
export const get_imdb_show_info = async (tv_show_id: string) => {
  const fetch_response = await axios.get(
    `${process.env.IMDB_URI}/Title/${process.env.IMDB_API_KEY}/${tv_show_id}`
  );
  const data = fetch_response.data as IMDBShowInfoType;
  return data;
};

export const get_show_season_info = async (
  tv_show_id: string,
  season_number: number
) => {
  const fetch_response = await axios.get(
    `${process.env.TMDB_URI}/tv/${tv_show_id}/season/${season_number}?api_key=${process.env.TMDB_API_KEY}`
  );
  const data = fetch_response.data as SeasonType;
  return data;
};

export const get_imdb_season_info = async (
  imdb_id: string,
  season_number: number
) => {
  // console.log(
  //   `${process.env.IMDB_URI}/SeasonEpisodes/${process.env.IMDB_API_KEY}/${imdb_id}/${season_number}`
  // );

  const fetch_response = await axios.get(
    `${process.env.IMDB_URI}/SeasonEpisodes/${process.env.IMDB_API_KEY}/${imdb_id}/${season_number}`
  );

  const data = fetch_response.data as ImdbSeasonType;
  return data;
};

export const get_omdb_season_info = async (
  imdb_id: string,
  season_number: number
) => {
  const fetch_response = await axios.get(
    `${process.env.OMDB_URI}/?i=${imdb_id}&Season=${season_number}&apikey=${process.env.OMDB_API_KEY}`
  );
  const data = fetch_response.data as OmdbSeasonType;
  return data;
};
export const get_omdb_episode_info = async (
  imdb_id: string,
  season_number: string,
  episode_number: string
) => {
  const fetch_response = await axios.get(
    `${process.env.OMDB_URI}/?i=${imdb_id}&Season=${season_number}&Episode=${episode_number}&apikey=${process.env.OMDB_API_KEY}`
  );
  const data = fetch_response.data as OmdbEpisodeType;
  return data;
};
export const get_real_shows = async (results: ResultType[]) => {
  let results_map = new Map();
  results.forEach((result, index) => {
    results_map.set(index, result);
  });

  let promises = [];
  for (const result of results) {
    promises.push(get_imdb_id(result.id.toString()));
  }
  let isReal = await Promise.all(promises);

  const real_results: ResultType[] = [];
  isReal.forEach((result, index) => {
    if (result !== null) {
      real_results.push(results_map.get(index));
    }
  });
  return real_results.sort((a, b) => b.popularity - a.popularity);
};
