import express, { NextFunction, Request, Response } from "express";
import axios from "axios";
import {
  EpisodesType,
  ErrorType,
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
  "/tv/:tv_show_id",
  async (req: Request, res: Response, next: NextFunction) => {
    const { tv_show_id } = req.params;
    try {
      const fetch_response = await axios.get(
        `${process.env.TMDB_URI}/tv/${tv_show_id}?api_key=${process.env.TMDB_API_KEY}`
      );
      const data = fetch_response.data as ShowType;
      return res.status(200).json(data);
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
