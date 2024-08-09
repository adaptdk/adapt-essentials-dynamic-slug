import { FieldAppSDK } from "@contentful/app-sdk";
import {
  Flex,
  IconButton,
  Stack,
  TextInput,
  TextLink,
  Tooltip,
  Button,
  Box,
} from "@contentful/f36-components";
import {
  useSDK,
  useFieldValue,
  useAutoResizer,
} from "@contentful/react-apps-toolkit";
import tokens from "@contentful/f36-tokens";
import { css } from "emotion";
import { CycleIcon, InfoCircleIcon, LinkIcon } from "@contentful/f36-icons";
import { useEffect, useState } from "react";
import { slugify, makeSlug } from "@contentful/field-editor-slug";
import get from "lodash.get";
import { createClient } from "contentful-management";
import { EntryStatus, getEntryStatus } from "../utils";

const styles = {
  infoIcon: css({
    marginRight: tokens.spacingXs,
  }),
};

function fillTheTemplate(template: string, data: Record<string, any>) {
  return template.replace(/\{(.+?)\}/g, (match, key) => {
    const value = get(data, key);
    return value ?? match;
  });
}

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  const cma = createClient(
    { apiAdapter: sdk.cmaAdapter },
    {
      type: "plain",
      defaults: {
        environmentId: sdk.ids.environmentAlias ?? sdk.ids.environment,
        spaceId: sdk.ids.space,
      },
    }
  );

  const entrySys = sdk.entry.getSys();
  const fields = sdk.entry.fields;

  const slugField = sdk.field;
  const [slugFieldValue, setSlugFieldValue] = useFieldValue<string>(
    slugField.id,
    slugField.locale
  );

  const collectTextFields = () => {
    return Object.fromEntries(
      Object.keys(fields)
        .filter((fieldKey) => fields[fieldKey].type === "Symbol")
        .map((fieldKey) => [fieldKey, slugify(fields[fieldKey].getValue())])
    );
  };
  const [textFields, setTextFields] = useState(collectTextFields());
  const [rawSlugFieldValue, setRawSlugFieldValue] = useState(slugFieldValue);

  const {
    instance,
    installation,
    installation: { previewEnabled = false, previewButtonCaption },
  } = sdk.parameters;
  const { template, previewTemplate, fieldToSlugify } = instance;

  const resultingUrl = fillTheTemplate(template, {
    fields: textFields,
    siteUrl: "",
    previewSiteUrl: "",
    slug: slugFieldValue,
    ...installation,
  }).replace(/(?<!:)\/{2,}/g, "/");

  const resultingPreviewUrl = fillTheTemplate(previewTemplate, {
    fields: textFields,
    siteUrl: "",
    previewSiteUrl: "",
    slug: slugFieldValue,
    ...installation,
  }).replace(/(?<!:)\/{2,}/g, "/");

  const initialSlugValue = makeSlug(textFields?.[fieldToSlugify], {
    locale: slugField.locale,
    isOptionalLocaleWithFallback: false,
    createdAt: entrySys.createdAt,
  });

  const [isTouched, setIsTouched] = useState(
    !!slugField.getValue() || slugField.getValue() === initialSlugValue
  );

  const resetSlug = () => {
    setIsTouched(false);
    setSlugFieldValue(initialSlugValue);
    setRawSlugFieldValue(initialSlugValue);
  };

  useEffect(() => {
    if (!isTouched) {
      setSlugFieldValue(initialSlugValue);
    }
  }, [isTouched]);

  useEffect(function SubscribeToTextFields() {
    const textFieldKeys = Object.keys(textFields);

    textFieldKeys
      .filter((fieldKey) => fieldKey !== slugField.name)
      .forEach((fieldKey) => {
        fields[fieldKey].onValueChanged((newValue) => {
          setTextFields((prev) => ({
            ...prev,
            [fieldKey]: slugify(newValue),
          }));
        });
      });
    return textFieldKeys.forEach((fieldKey) => {
      fields[fieldKey].onValueChanged(() => {});
    });
  }, []);

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsTouched(true);
    setRawSlugFieldValue(e?.target?.value ?? "");
    const slugified = e?.target?.value
      ?.split("/")
      .map((part) => slugify(part))
      .join("/")
      .replace(/\/{2,}/g, "/");
    setSlugFieldValue(slugified);
  };

  useAutoResizer();

  const isDraftInitially = getEntryStatus(entrySys) === EntryStatus.DRAFT;
  const isArchivedInitially = getEntryStatus(entrySys) === EntryStatus.ARCHIVED;

  const [showURL, setShowURL] = useState(
    !isDraftInitially && !isArchivedInitially
  );
  const [showPreviewURL, setShowPreviewURL] = useState(
    previewEnabled && !isArchivedInitially
  );

  sdk.entry.onSysChanged((sys) => {
    cma.entry
      .get({
        entryId: sys.id,
      })
      .then((entry) => {
        const status = getEntryStatus(entry.sys);
        setShowURL(
          status !== EntryStatus.DRAFT && status !== EntryStatus.ARCHIVED
        );
        setShowPreviewURL(previewEnabled && status !== EntryStatus.ARCHIVED);
      });
  });

  return (
    <Stack flexDirection="column" alignItems="flex-start">
      <TextInput.Group>
        <TextInput
          icon={<LinkIcon className={css()} />}
          size="medium"
          aria-label="Content type name"
          id="content-type-name"
          value={rawSlugFieldValue}
          onChange={handleSlugChange}
        />
        <IconButton
          variant="secondary"
          icon={<CycleIcon />}
          onClick={resetSlug}
          aria-label="reset"
        />
      </TextInput.Group>
      {showURL && (
        <>
          <Tooltip
            placement="top-start"
            id="url-tooltip"
            content={`Template "${template}" was used to generate this URL.`}
          >
            <Flex>
              <InfoCircleIcon className={styles.infoIcon} />
              <span>URL</span>
            </Flex>
          </Tooltip>
          {resultingUrl && (
            <TextLink target="_blank" href={resultingUrl}>
              {resultingUrl}
            </TextLink>
          )}
        </>
      )}
      {showPreviewURL && resultingPreviewUrl && !previewButtonCaption && (
        <Box>
          <Tooltip
            placement="top-start"
            id="url-tooltip"
            content={`Template "${previewTemplate}" was used to generate this URL.`}
          >
            <Flex>
              <InfoCircleIcon className={styles.infoIcon} />
              <span>Preview URL </span>
            </Flex>
          </Tooltip>
          <TextLink target="_blank" href={resultingPreviewUrl}>
            {resultingPreviewUrl}
          </TextLink>
        </Box>
      )}
      {resultingPreviewUrl && previewButtonCaption && (
        <Button
          as="a"
          href={resultingPreviewUrl}
          target="_blank"
          variant="primary"
        >
          {previewButtonCaption}
        </Button>
      )}
    </Stack>
  );
};

export default Field;
