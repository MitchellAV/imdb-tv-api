import axios from "axios";
import express, { NextFunction, Request, Response } from "express";
import {
  get_imdb_id,
  get_imdb_season_info,
  get_imdb_show_info,
  get_tmdb_show_info,
  get_real_shows,
  get_tmdb_id,
} from "../util/functions/api-functions";
import {
  EpisodesType,
  ErrorType,
  ResultType,
  SearchType,
  SeasonType,
} from "../util/types";

const router = express.Router();

router.get(
  "/search/:tv_show_title",
  async (req: Request, res: Response, next: NextFunction) => {
    const { tv_show_title } = req.params;
    const page = req.query.page || 1;

    try {
      const fetch_response = await axios.get(
        `${process.env.TMDB_URI}/search/tv?api_key=${process.env.TMDB_API_KEY}&query=${tv_show_title}&page=${page}`
      );
      let data = fetch_response.data as SearchType;
      data.results = await get_real_shows(data.results);

      return res.status(200).json(data);
    } catch (err) {
      return next({
        errors: [],
        message: "Unable to get search results from external API",
        status: 500,
      } as ErrorType);
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
      return next({
        errors: [],
        message: "Unable to get popular shows from external API",
        status: 500,
      } as ErrorType);
    }
  }
);
router.get(
  "/tv/trending/week",
  async (req: Request, res: Response, next: NextFunction) => {
    const page = req.query.page || 1;

    try {
      const fetch_response = await axios.get(
        `${process.env.TMDB_URI}/trending/tv/week?api_key=${process.env.TMDB_API_KEY}&page=${page}`
      );
      const data = fetch_response.data;
      return res.status(200).json(data);
    } catch (err) {
      return next({
        errors: [],
        message: "Unable to get trending shows from external API",
        status: 500,
      } as ErrorType);
    }
  }
);
router.get(
  "/tv/trending/day",
  async (req: Request, res: Response, next: NextFunction) => {
    const page = req.query.page || 1;

    try {
      const fetch_response = await axios.get(
        `${process.env.TMDB_URI}/trending/tv/day?api_key=${process.env.TMDB_API_KEY}&page=${page}`
      );
      const data = fetch_response.data;
      return res.status(200).json(data);
    } catch (err) {
      return next({
        errors: [],
        message: "Unable to get trending shows from external API",
        status: 500,
      } as ErrorType);
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
      return next({
        errors: [],
        message: "Unable to get top rated shows from external API",
        status: 500,
      } as ErrorType);
    }
  }
);

/**
 *
 */
router.get(
  "/tv/:imdb_show_id/seasons",
  async (req: Request, res: Response, next: NextFunction) => {
    const imdb_id = req.params.imdb_show_id;
    try {
      // if imdb id exists

      // get show info
      // const tv_show_info_tmdb = await get_tmdb_show_info(tmdb_show_id);

      // let number_of_seasons = tv_show_info_tmdb.number_of_seasons;

      // get info for each season
      // const imdb_seasons_promises = [];
      // for (let index = 1; index <= number_of_seasons; index++) {
      //   const imdb_season_info = get_imdb_season_info(imdb_id, index);
      //   imdb_seasons_promises.push(imdb_season_info);
      // }
      // let imdb_seasons = await Promise.all(imdb_seasons_promises);

      // loop til error
      const imdb_seasons_promises = [];
      let current_season = 1;
      let isFinished = false;
      while (!isFinished) {
        const imdb_season_info = await get_imdb_season_info(
          imdb_id,
          current_season
        );
        if (imdb_season_info.errorMessage !== "") {
          isFinished = true;
          console.log("End of seasons");
          break;
        }
        imdb_seasons_promises.push(imdb_season_info);
        console.log(current_season);
        current_season++;
        // console.log(imdb_season_info);
      }

      let imdb_seasons = imdb_seasons_promises;
      // let imdb_seasons = imdb_seasons_promises;
      // console.log(imdb_seasons);

      imdb_seasons = imdb_seasons.filter(
        (seasons) => seasons.errorMessage === ""
      );

      // modify episode rating to be 0 if none exists
      imdb_seasons.forEach((season) => {
        if (season.episodes) {
          season.episodes = season.episodes.map((ep) => {
            const { imDbRating, imDbRatingCount } = ep;

            return {
              ...ep,
              imDbRating:
                imDbRating == "" ? 0 : parseFloat(imDbRating as string),
            };
          });
        }
      });

      const combinedData = {
        seasons: imdb_seasons,
      };

      return res.status(200).json(combinedData);
    } catch (err) {
      console.log(err);
      return next({
        errors: [],
        message: "Unable to get show information from external API",
        status: 500,
      } as ErrorType);
    }
  }
);
router.get(
  "/tv/:tmdb_show_id",
  async (req: Request, res: Response, next: NextFunction) => {
    const { tmdb_show_id } = req.params;
    try {
      // get imdb id for show
      const imdb_id = await get_imdb_id(tmdb_show_id);

      // check if imdb id exists for show
      if (imdb_id) {
        // if imdb id exists

        // get show info
        let tv_show_info = await get_imdb_show_info(imdb_id);

        const combinedData = {
          show_info: tv_show_info,
        };

        return res.status(200).json(combinedData);
      } else {
        throw new Error("No imdb id found");
      }
    } catch (err) {
      console.log(err);
      return next({
        errors: [],
        message: "Unable to get show information from external API",
        status: 500,
      } as ErrorType);
    }
  }
);

router.get(
  "/id/:imdb_id",
  async (req: Request, res: Response, next: NextFunction) => {
    const { imdb_id } = req.params;
    try {
      const tmdb_id = await get_tmdb_id(imdb_id);
      res.status(200).json({ tmdb_id });
    } catch (err) {
      next({
        message: "Unable to get TMDb ID from external API",
        status: 404,
        errors: [],
      });
    }
  }
);

router.get(
  "/tv/:tv_show_id/external_ids",
  async (req: Request, res: Response, next: NextFunction) => {
    const { tv_show_id } = req.params;

    try {
      const imdb_id = await get_imdb_id(tv_show_id);
      return res.status(200).json(imdb_id);
    } catch (err) {
      return next({
        errors: [],
        message: "Unable to get IMDb ID from external API",
        status: 500,
      } as ErrorType);
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
      return next({
        errors: [],
        message: "Unable to get show recommendations from external API",
        status: 500,
      } as ErrorType);
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
      return next({
        errors: [],
        message: "Unable to get seasons information from external API",
        status: 500,
      } as ErrorType);
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
      return next({
        errors: [],
        message: "Unable to get episode information from external API",
        status: 500,
      } as ErrorType);
    }
  }
);

export default router;
