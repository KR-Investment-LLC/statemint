/*
 * MIT License
 *
 * Copyright (c) 2025 KRI, LLC
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { 
    createLogger, 
    Logger,
    format, 
    transports 
} from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import type TransportStream from "winston-transport";
import path from "path";
import { IRuntimeConfig } from "../runtime/RuntimeConfig.js";

const _transports: TransportStream[] = [];
const _format     = format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
);
let   _logger: Logger;

export function getLogger(config: IRuntimeConfig): Logger {
    if(_logger) return _logger;

    if(config.logging.console) {
        _transports.push(
            new transports.Console({
                level:  config.logging.level,
                format: _format,
            })
        );
    }

    if(config.logging.file) {
        _transports.push(
            new DailyRotateFile({
                dirname:       config.logging.path,
                filename:      "stratoform-%DATE%.log",
                datePattern:   "YYYY-MM-DD",       
                zippedArchive: config.logging.zipArchive,
                maxSize:       `${config.logging.maxSize}m`,
                maxFiles:      `${config.logging.maxDays}d`,
                level:         config.logging.level,
                format:        _format,
            })
        );
    }

    _logger = createLogger({
        level:       config.logging.level,
        format:      _format,
        transports:  _transports,
        exitOnError: false,
    });

    return _logger;
}