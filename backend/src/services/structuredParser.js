const { GoogleGenAI, Type } = require("@google/genai");
const { z } = require("zod");

const env = require("../config/env");

// Gemini client
const ai = env.geminiApiKey
  ? new GoogleGenAI({
      apiKey: env.geminiApiKey,
    })
  : null;

/* ---------------------------------------------------------
   Gemini JSON Response Schema
--------------------------------------------------------- */

const linkSchema = {
  type: Type.OBJECT,
  required: ["label", "url"],
  properties: {
    label: {
      type: Type.STRING,
    },
    url: {
      type: Type.STRING,
    },
  },
};

const responseSchema = {
  type: Type.OBJECT,

  required: [
    "basics",
    "summary",
    "experience",
    "education",
    "skills",
    "projects",
    "certifications",
    "languages",
    "interests",
  ],

  properties: {
    basics: {
      type: Type.OBJECT,

      required: [
        "name",
        "title",
        "location",
        "email",
        "phone",
        "links",
      ],

      properties: {
        name: {
          type: Type.STRING,
        },

        title: {
          type: Type.STRING,
        },

        location: {
          type: Type.STRING,
        },

        email: {
          type: Type.STRING,
        },

        phone: {
          type: Type.STRING,
        },

        links: {
          type: Type.ARRAY,
          items: linkSchema,
        },
      },
    },

    summary: {
      type: Type.STRING,
    },

    experience: {
      type: Type.ARRAY,

      items: {
        type: Type.OBJECT,

        required: [
          "company",
          "role",
          "location",
          "period",
          "bullets",
        ],

        properties: {
          company: {
            type: Type.STRING,
          },

          role: {
            type: Type.STRING,
          },

          location: {
            type: Type.STRING,
          },

          period: {
            type: Type.STRING,
          },

          bullets: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
          },
        },
      },
    },

    education: {
      type: Type.ARRAY,

      items: {
        type: Type.OBJECT,

        required: [
          "degree",
          "school",
          "period",
        ],

        properties: {
          degree: {
            type: Type.STRING,
          },

          school: {
            type: Type.STRING,
          },

          location: {
            type: Type.STRING,
          },

          period: {
            type: Type.STRING,
          },

          details: {
            type: Type.STRING,
          },
        },
      },
    },

    skills: {
      type: Type.ARRAY,

      items: {
        type: Type.STRING,
      },
    },

    projects: {
      type: Type.ARRAY,

      items: {
        type: Type.OBJECT,

        required: [
          "name",
          "description",
        ],

        properties: {
          name: {
            type: Type.STRING,
          },

          description: {
            type: Type.STRING,
          },

          tech: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
          },

          links: {
            type: Type.ARRAY,
            items: linkSchema,
          },
        },
      },
    },

    certifications: {
      type: Type.ARRAY,

      items: {
        type: Type.OBJECT,

        required: ["name"],

        properties: {
          name: {
            type: Type.STRING,
          },

          issuer: {
            type: Type.STRING,
          },

          year: {
            type: Type.STRING,
          },
        },
      },
    },

    languages: {
      type: Type.ARRAY,

      items: {
        type: Type.STRING,
      },
    },

    interests: {
      type: Type.ARRAY,

      items: {
        type: Type.STRING,
      },
    },
  },
};

/* ---------------------------------------------------------
   Zod Validator
--------------------------------------------------------- */

const validator = z.object({
  basics: z.object({
    name: z.string().default(""),
    title: z.string().default(""),
    location: z.string().default(""),
    email: z.string().default(""),
    phone: z.string().default(""),

    links: z
      .array(
        z.object({
          label: z.string().default(""),
          url: z.string().default(""),
        })
      )
      .default([]),
  }),

  summary: z.string().default(""),

  experience: z
    .array(
      z.object({
        company: z.string().default(""),
        role: z.string().default(""),
        location: z.string().default(""),
        period: z.string().default(""),

        bullets: z
          .array(z.string())
          .default([]),
      })
    )
    .default([]),

  education: z
    .array(
      z.object({
        degree: z.string().default(""),
        school: z.string().default(""),
        location: z.string().default(""),
        period: z.string().default(""),
        details: z.string().default(""),
      })
    )
    .default([]),

  skills: z
    .array(z.string())
    .default([]),

  projects: z
    .array(
      z.object({
        name: z.string().default(""),
        description: z.string().default(""),

        tech: z
          .array(z.string())
          .default([]),

        links: z
          .array(
            z.object({
              label: z.string().default(""),
              url: z.string().default(""),
            })
          )
          .default([]),
      })
    )
    .default([]),

  certifications: z
    .array(
      z.object({
        name: z.string().default(""),
        issuer: z.string().default(""),
        year: z.string().default(""),
      })
    )
    .default([]),

  languages: z
    .array(z.string())
    .default([]),

  interests: z
    .array(z.string())
    .default([]),
});

/* ---------------------------------------------------------
   Prompt
--------------------------------------------------------- */

function buildPrompt(rawText) {
  return [
    "You are a resume parser.",

    "The input is text extracted from a PDF.",
    "The lines may be jumbled or out of natural reading order.",

    "",

    "Extract structured data from the resume.",

    "",
    "Extract the following:",

    "- basics: name, professional title, location, email, phone, social links.",
    '- social links should contain label and full URL.',
    "- summary: professional summary paragraph.",
    "- experience: jobs from most recent to oldest.",
    "- experience should contain company, role, period, location and bullet points.",
    "- education: degree, school, period, location and optional details.",
    "- skills: technical and professional skills.",
    "- projects: project name, description, technologies and optional links.",
    "- certifications: certification name, issuer and year.",
    "- languages: languages mentioned in the resume.",
    "- interests: hobbies or interests mentioned in the resume.",

    "",
    "Rules:",

    "- Be conservative.",
    "- Do not invent information.",
    "- Do not add information that is not present in the resume.",
    "- Use empty strings when information is missing.",
    "- Use empty arrays when list information is missing.",
    "- Preserve original wording wherever possible.",
    "- Do not paraphrase unnecessarily.",
    "- Preserve original date formats.",
    "- Keep experience bullet points as complete sentences when possible.",

    "",

    "RESUME TEXT:",
    "--------------------",
    rawText,
    "--------------------",
  ].join("\n");
}

/* ---------------------------------------------------------
   Empty Response
--------------------------------------------------------- */

const EMPTY = {
  basics: {
    name: "",
    title: "",
    location: "",
    email: "",
    phone: "",
    links: [],
  },

  summary: "",

  experience: [],

  education: [],

  skills: [],

  projects: [],

  certifications: [],

  languages: [],

  interests: [],
};

/* ---------------------------------------------------------
   Parse Resume
--------------------------------------------------------- */

async function parseResume(rawText) {
  if (!ai || !rawText?.trim()) {
    return EMPTY;
  }

  const prompt = buildPrompt(rawText);

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await ai.models.generateContent({
        model: env.geminiModel,

        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],

        config: {
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.1,
        },
      });

      const text =
        typeof result.text === "function"
          ? result.text()
          : result.text;

      if (!text) {
        throw new Error("Empty response from Gemini");
      }

      let parsed;

      try {
        parsed = JSON.parse(text);
      } catch (jsonError) {
        console.error(
          "Gemini returned invalid JSON:",
          jsonError.message
        );

        throw jsonError;
      }

      return validator.parse({
        ...EMPTY,
        ...parsed,

        basics: {
          ...EMPTY.basics,
          ...(parsed.basics || {}),
        },
      });
    } catch (err) {
      console.error(
        `Structured parse attempt ${attempt} failed:`,
        err.message
      );

      if (attempt === 2) {
        return EMPTY;
      }
    }
  }

  return EMPTY;
}

/* ---------------------------------------------------------
   Export
--------------------------------------------------------- */

module.exports = {
  parseResume,
};