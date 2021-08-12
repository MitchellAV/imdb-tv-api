import express, { NextFunction, Request, Response } from "express";
import axios from "axios";
import {
  EpisodesType,
  ErrorType,
  ExternalIDsType,
  OmdbEpisodeType,
  OmdbSeasonType,
  SearchType,
  SeasonType,
  ShowType,
} from "../util/types";
require("dotenv").config();
const router = express.Router();

router.get(
  "/search/:tv_show_title",
  async (req: Request, res: Response, next: NextFunction) => {
    console.log(req.params);

    const { tv_show_title } = req.params;
    const page = req.query.page || 1;

    try {
      console.log(tv_show_title);

      const fetch_response = await axios.get(
        `${process.env.TMDB_URI}/search/tv?api_key=${process.env.TMDB_API_KEY}&query=${tv_show_title}&page=${page}`
      );
      const data = fetch_response.data as SearchType;
      return res.status(200).json(data);
    } catch (err) {
      return next({ errors: [], message: "", status: 500 } as ErrorType);
    }
  }
);
router.get(
  "/tv/popular",
  async (req: Request, res: Response, next: NextFunction) => {
    const page = req.query.page || 1;

    try {
      const fetch_response = await axios.get(
        `${process.env.TMDB_URI}/tv/popular?api_key=${process.env.TMDB_API_KEY}&page=${page}`
      );
      const data = fetch_response.data;
      return res.status(200).json(data);
    } catch (err) {
      return next({ errors: [], message: "", status: 500 } as ErrorType);
    }
  }
);
router.get(
  "/tv/top_rated",
  async (req: Request, res: Response, next: NextFunction) => {
    const page = req.query.page || 1;

    try {
      const fetch_response = await axios.get(
        `${process.env.TMDB_URI}/tv/top_rated?api_key=${process.env.TMDB_API_KEY}&page=${page}`
      );
      const data = fetch_response.data;
      return res.status(200).json(data);
    } catch (err) {
      return next({ errors: [], message: "", status: 500 } as ErrorType);
    }
  }
);

const get_show_info = async (tv_show_id: string) => {
  const fetch_response = await axios.get(
    `${process.env.TMDB_URI}/tv/${tv_show_id}?api_key=${process.env.TMDB_API_KEY}`
  );
  const data = fetch_response.data as ShowType;
  return data;
};

const get_show_season_info = async (
  tv_show_id: string,
  season_number: number
) => {
  const fetch_response = await axios.get(
    `${process.env.TMDB_URI}/tv/${tv_show_id}/season/${season_number}?api_key=${process.env.TMDB_API_KEY}`
  );
  const data = fetch_response.data as SeasonType;
  return data;
};

const get_imdb_season_info = async (imdb_id: string, season_number: number) => {
  const fetch_response = await axios.get(
    `${process.env.OMDB_URI}/?i=${imdb_id}&Season=${season_number}&apikey=${process.env.OMDB_API_KEY}`
  );
  const data = fetch_response.data as OmdbSeasonType;
  return data;
};
const get_imdb_episode_info = async (
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

router.get(
  "/tv/:tv_show_id",
  async (req: Request, res: Response, next: NextFunction) => {
    const { tv_show_id } = req.params;
    try {
      // get show info and number of seasons
      const tv_show_info = await get_show_info(tv_show_id);
      const { number_of_seasons } = tv_show_info;
      // get season info for all seasons
      const imdb_id = await get_imdb_id(tv_show_id);

      const imdb_episode_map = new Map<
        string,
        {
          rating: number;
          votes: number;
        }
      >();
      if (imdb_id) {
        const imdb_seasons_promises = [];
        for (let index = 1; index <= number_of_seasons; index++) {
          const imdb_season_info = get_imdb_season_info(imdb_id, index);
          imdb_seasons_promises.push(imdb_season_info);
        }
        let imdb_seasons = await Promise.all(imdb_seasons_promises);

        const imdb_episodes_promises = [];
        for (let index = 1; index <= imdb_seasons.length; index++) {
          let current_season = imdb_seasons[index - 1];
          const { Episodes: episodes, Season: season_number } = current_season;
          if (episodes) {
            for (let j = 0; j < episodes.length; j++) {
              const { Episode: episode_number } = episodes[j];

              const imdb_episode_info = get_imdb_episode_info(
                imdb_id,
                season_number,
                episode_number
              );
              imdb_episodes_promises.push(imdb_episode_info);
            }
          }
        }
        let imdb_episodes = await Promise.all(imdb_episodes_promises);
        // console.log(imdb_seasons);
        imdb_episodes.forEach((episode) => {
          const {
            Season: season_number,
            Episode: episode_number,
            imdbRating,
            imdbVotes,
          } = episode;

          imdb_episode_map.set(`${season_number}-${episode_number}`, {
            rating: parseFloat(imdbRating),
            votes: parseFloat(imdbVotes),
          });
        });
        // imdb_seasons.forEach((season) => {
        //   const { Season: season_number, Episodes: episodes } = season;
        //   if (episodes) {
        //     episodes.forEach((ep) => {
        //       imdb_episode_map.set(
        //         `${season_number}-${ep.Episode}`,
        //         parseFloat(ep.imdbRating)
        //       );
        //     });
        //   }
        // });
      }
      const promises = [];

      for (let index = 1; index <= number_of_seasons; index++) {
        promises.push(get_show_season_info(tv_show_id, index));
      }
      let tv_show_all_seasons_info = await Promise.all(promises);
      // combine data to

      tv_show_all_seasons_info.forEach((season) => {
        const { season_number, episodes } = season;
        if (episodes) {
          episodes.forEach((ep) => {
            let { episode_number } = ep;
            const ep_map_index = `${season_number}-${episode_number}`;
            const imdb_episode_rating = imdb_episode_map.get(ep_map_index);
            if (imdb_episode_rating && !isNaN(imdb_episode_rating.rating)) {
              console.log(imdb_episode_rating);
              ep.vote_average = imdb_episode_rating.rating;
              ep.vote_count = imdb_episode_rating.votes;
            }
          });
        }
      });

      const combinedData = {
        show_info: tv_show_info,
        seasons: tv_show_all_seasons_info,
      };

      return res.status(200).json(combinedData);
    } catch (err) {
      return next({ errors: [], message: "", status: 500 } as ErrorType);
    }
  }
);

const get_imdb_id = async (tmdb_id: string) => {
  const fetch_response = await axios.get(
    `${process.env.TMDB_URI}/tv/${tmdb_id}/external_ids?api_key=${process.env.TMDB_API_KEY}`
  );
  const data = fetch_response.data as ExternalIDsType;
  return data.imdb_id;
};

router.get(
  "/tv/:tv_show_id/external_ids",
  async (req: Request, res: Response, next: NextFunction) => {
    const { tv_show_id } = req.params;

    try {
      const imdb_id = await get_imdb_id(tv_show_id);
      return res.status(200).json(imdb_id);
    } catch (err) {
      return next({ errors: [], message: "", status: 500 } as ErrorType);
    }
  }
);
router.get(
  "/tv/:tv_show_id/recommendations",
  async (req: Request, res: Response, next: NextFunction) => {
    const { tv_show_id } = req.params;
    const page = req.query.page || 1;

    try {
      const fetch_response = await axios.get(
        `${process.env.TMDB_URI}/tv/${tv_show_id}/recommendations?api_key=${process.env.TMDB_API_KEY}&page=${page}`
      );
      const data = fetch_response.data;
      return res.status(200).json(data);
    } catch (err) {
      return next({ errors: [], message: "", status: 500 } as ErrorType);
    }
  }
);
router.get(
  "/tv/:tv_show_id/season/:tv_show_season_number",
  async (req: Request, res: Response, next: NextFunction) => {
    const { tv_show_id, tv_show_season_number } = req.params;
    try {
      const fetch_response = await axios.get(
        `${process.env.TMDB_URI}/tv/${tv_show_id}/season/${tv_show_season_number}?api_key=${process.env.TMDB_API_KEY}`
      );
      const data = fetch_response.data as SeasonType;
      return res.status(200).json(data);
    } catch (err) {
      return next({ errors: [], message: "", status: 500 } as ErrorType);
    }
  }
);
router.get(
  "/tv/:tv_show_id/season/:tv_show_season_number/episode/:tv_show_episode_number",
  async (req: Request, res: Response, next: NextFunction) => {
    const { tv_show_id, tv_show_season_number, tv_show_episode_number } =
      req.params;
    try {
      const fetch_response = await axios.get(
        `${process.env.TMDB_URI}/tv/${tv_show_id}/season/${tv_show_season_number}/episode/${tv_show_episode_number}?api_key=${process.env.TMDB_API_KEY}`
      );
      const data = fetch_response.data as EpisodesType;
      return res.status(200).json(data);
    } catch (err) {
      return next({ errors: [], message: "", status: 500 } as ErrorType);
    }
  }
);

export default router;
