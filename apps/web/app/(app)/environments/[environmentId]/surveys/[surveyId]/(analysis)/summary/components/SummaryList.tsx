import EmptyInAppSurveys from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/components/EmptyInAppSurveys";
import CalSummary from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/summary/components/CalSummary";
import ConsentSummary from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/summary/components/ConsentSummary";
import HiddenFieldsSummary from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/summary/components/HiddenFieldsSummary";
import PictureChoiceSummary from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/summary/components/PictureChoiceSummary";

import { getLocalizedValue } from "@formbricks/lib/i18n/utils";
import { TEnvironment } from "@formbricks/types/environment";
import { TResponse } from "@formbricks/types/responses";
import { TSurveyQuestionType } from "@formbricks/types/surveys";
import type {
  TSurveyCalQuestion,
  TSurveyDateQuestion,
  TSurveyFileUploadQuestion,
  TSurveyLanguage,
  TSurveyPictureSelectionQuestion,
  TSurveyQuestionSummary,
} from "@formbricks/types/surveys";
import {
  TSurvey,
  TSurveyCTAQuestion,
  TSurveyConsentQuestion,
  TSurveyMultipleChoiceMultiQuestion,
  TSurveyMultipleChoiceSingleQuestion,
  TSurveyNPSQuestion,
  TSurveyOpenTextQuestion,
  TSurveyQuestion,
  TSurveyRatingQuestion,
} from "@formbricks/types/surveys";
import EmptySpaceFiller from "@formbricks/ui/EmptySpaceFiller";

import CTASummary from "./CTASummary";
import DateQuestionSummary from "./DateQuestionSummary";
import FileUploadSummary from "./FileUploadSummary";
import MultipleChoiceSummary from "./MultipleChoiceSummary";
import NPSSummary from "./NPSSummary";
import OpenTextSummary from "./OpenTextSummary";
import RatingSummary from "./RatingSummary";

interface SummaryListProps {
  environment: TEnvironment;
  survey: TSurvey;
  responses: TResponse[];
  responsesPerPage: number;
}

export default function SummaryList({ environment, survey, responses, responsesPerPage }: SummaryListProps) {
  const defaultLanguageCode = "default";

  const getLanguageCode = (surveyLanguages: TSurveyLanguage[], languageCode: string | null) => {
    if (!surveyLanguages?.length || !languageCode) return "default";
    const language = surveyLanguages.find((surveyLanguage) => surveyLanguage.language.code === languageCode);
    return language?.default ? "default" : language?.language.code || "default";
  };

  const checkForI18n = (response: TResponse, id, survey: TSurvey) => {
    // Get the languageCode based on the survey's languages and the response's language
    const languageCode = getLanguageCode(survey.languages, response.language);

    const question = survey.questions.find((question) => question.id === id);

    if (question?.type === "multipleChoiceMulti") {
      // Initialize an array to hold the choice values
      let choiceValues = [] as string[];

      (response.data[id] as string[]).forEach((data) => {
        choiceValues.push(
          getLocalizedValue(
            question.choices.find((choice) => choice.label[languageCode] === data)?.label,
            defaultLanguageCode
          ) || data
        );
      });

      // Return the array of localized choice values
      return choiceValues;
    }

    // For other question types, get the localized value of the choice or other value to the raw data
    return (
      getLocalizedValue(
        (question as TSurveyMultipleChoiceMultiQuestion | TSurveyMultipleChoiceSingleQuestion)?.choices.find(
          (choice) => choice.label[languageCode] === response.data[id]
        )?.label,
        defaultLanguageCode
      ) || response.data[id]
    );
  };

  const getSummaryData = (): TSurveyQuestionSummary<TSurveyQuestion>[] =>
    survey.questions.map((question) => {
      const questionResponses = responses
        .filter((response) => question.id in response.data)
        .map((r) => ({
          id: r.id,
          value:
            question.type === "multipleChoiceSingle" || question.type === "multipleChoiceMulti"
              ? checkForI18n(r, question.id, survey)
              : r.data[question.id],
          updatedAt: r.updatedAt,
          person: r.person,
        }));

      return {
        question,
        responses: questionResponses,
      };
    });

  return (
    <div className="mt-10 space-y-8">
      {survey.type === "web" && responses.length === 0 && !environment.widgetSetupCompleted ? (
        <EmptyInAppSurveys environment={environment} />
      ) : responses.length === 0 ? (
        <EmptySpaceFiller
          type="response"
          environment={environment}
          noWidgetRequired={survey.type === "link"}
        />
      ) : (
        <>
          {getSummaryData().map((questionSummary) => {
            if (questionSummary.question.type === TSurveyQuestionType.OpenText) {
              return (
                <OpenTextSummary
                  key={questionSummary.question.id}
                  questionSummary={questionSummary as TSurveyQuestionSummary<TSurveyOpenTextQuestion>}
                  environmentId={environment.id}
                  responsesPerPage={responsesPerPage}
                />
              );
            }
            if (
              questionSummary.question.type === TSurveyQuestionType.MultipleChoiceSingle ||
              questionSummary.question.type === TSurveyQuestionType.MultipleChoiceMulti
            ) {
              return (
                <MultipleChoiceSummary
                  key={questionSummary.question.id}
                  questionSummary={
                    questionSummary as TSurveyQuestionSummary<
                      TSurveyMultipleChoiceMultiQuestion | TSurveyMultipleChoiceSingleQuestion
                    >
                  }
                  environmentId={environment.id}
                  surveyType={survey.type}
                  responsesPerPage={responsesPerPage}
                />
              );
            }
            if (questionSummary.question.type === TSurveyQuestionType.NPS) {
              return (
                <NPSSummary
                  key={questionSummary.question.id}
                  questionSummary={questionSummary as TSurveyQuestionSummary<TSurveyNPSQuestion>}
                />
              );
            }
            if (questionSummary.question.type === TSurveyQuestionType.CTA) {
              return (
                <CTASummary
                  key={questionSummary.question.id}
                  questionSummary={questionSummary as TSurveyQuestionSummary<TSurveyCTAQuestion>}
                />
              );
            }
            if (questionSummary.question.type === TSurveyQuestionType.Rating) {
              return (
                <RatingSummary
                  key={questionSummary.question.id}
                  questionSummary={questionSummary as TSurveyQuestionSummary<TSurveyRatingQuestion>}
                />
              );
            }
            if (questionSummary.question.type === TSurveyQuestionType.Consent) {
              return (
                <ConsentSummary
                  key={questionSummary.question.id}
                  questionSummary={questionSummary as TSurveyQuestionSummary<TSurveyConsentQuestion>}
                />
              );
            }
            if (questionSummary.question.type === TSurveyQuestionType.PictureSelection) {
              return (
                <PictureChoiceSummary
                  key={questionSummary.question.id}
                  questionSummary={questionSummary as TSurveyQuestionSummary<TSurveyPictureSelectionQuestion>}
                />
              );
            }
            if (questionSummary.question.type === TSurveyQuestionType.Date) {
              return (
                <DateQuestionSummary
                  key={questionSummary.question.id}
                  questionSummary={questionSummary as TSurveyQuestionSummary<TSurveyDateQuestion>}
                  environmentId={environment.id}
                  responsesPerPage={responsesPerPage}
                />
              );
            }
            if (questionSummary.question.type === TSurveyQuestionType.FileUpload) {
              return (
                <FileUploadSummary
                  key={questionSummary.question.id}
                  questionSummary={questionSummary as TSurveyQuestionSummary<TSurveyFileUploadQuestion>}
                  environmentId={environment.id}
                />
              );
            }

            if (questionSummary.question.type === TSurveyQuestionType.Cal) {
              return (
                <CalSummary
                  key={questionSummary.question.id}
                  questionSummary={questionSummary as TSurveyQuestionSummary<TSurveyCalQuestion>}
                  environmentId={environment.id}
                />
              );
            }

            return null;
          })}

          {survey.hiddenFields?.enabled &&
            survey.hiddenFields.fieldIds?.map((question) => {
              return (
                <HiddenFieldsSummary
                  environment={environment}
                  question={question}
                  responses={responses}
                  survey={survey}
                  key={question}
                />
              );
            })}
        </>
      )}
    </div>
  );
}
