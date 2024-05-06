import { FieldAppSDK } from "@contentful/app-sdk";
import {
  Flex,
  IconButton,
  Stack,
  TextInput,
  TextLink,
  Tooltip,
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

const styles = {
  fixFocus: css({
    padding: tokens.spacingXs,
  }),
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

  const { instance, installation } = sdk.parameters;
  const { template, fieldToSlugify } = instance;

  const resultingUrl = fillTheTemplate(template, {
    fields: textFields,
    siteUrl: "",
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
  return (
    <Stack flexDirection="column" alignItems="flex-start">
      <TextInput.Group className={styles.fixFocus}>
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
          aria-label="Unlock"
        />
      </TextInput.Group>

      <Tooltip
        placement="top-start"
        id="url-tooltip"
        content={`Template "${template}" was used to generate this URL.`}
      >
        <Flex>
          <InfoCircleIcon className={styles.infoIcon} />
          <span>Resulting url </span>
        </Flex>
      </Tooltip>

      {slugFieldValue && (
        <TextLink target="_blank" href={resultingUrl}>
          {resultingUrl}
        </TextLink>
      )}
    </Stack>
  );
};

export default Field;
