import i18next from "i18next";
import CompaniesRepository from "./companies.repository.js";
import {
  AuthError,
  InvariantError,
  NotFoundError,
} from "../exceptions/index.js";

const addCompany = async (payload, user) => {
  if (!user) throw new AuthError(i18next.t("error.invalidCredentials"));

  const idCompany = await CompaniesRepository.addNewCompany({
    ...payload,
    user_id: user.id,
  });

  if (!idCompany) throw new InvariantError(i18next.t("error.failedToCreate", { resource: i18next.t("resource.company") }));

  return idCompany;
};

const putCompanyById = async (id, payload, user) => {
  if (!id) throw new NotFoundError(i18next.t("error.idRequired"));

  const idCompany = await CompaniesRepository.updateCompanyById(
    id,
    payload,
    user,
  );

  if (!idCompany) throw new NotFoundError(i18next.t("error.failedToUpdate", { resource: i18next.t("resource.company") }));

  return idCompany;
};

const deleteCompanyById = async (id, user) => {
  if (!user) throw new AuthError(i18next.t("error.invalidCredentials"));

  const idCompany = await CompaniesRepository.deleteCompanyById(id);

  if (!idCompany) throw new NotFoundError(i18next.t("error.failedToDelete", { resource: i18next.t("resource.company") }));

  return idCompany;
};

const getAllCompanies = async () => {
  const companies = await CompaniesRepository.getAllCompanies();
  return companies;
};

const getCompanyById = async (id) => {
  if (!id) throw new NotFoundError(i18next.t("error.idRequired"));
  const company = await CompaniesRepository.getCompanyById(id);
  if (!company) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.company") }));
  return company;
};

const uploadLogo = async (companyId, file, user) => {
  if (!user) throw new AuthError(i18next.t("error.invalidCredentials"));
  if (!file) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.document") }));

  const company = await CompaniesRepository.getCompanyById(companyId);
  if (!company) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.company") }));

  // Verify ownership
  if (company.user_id !== user.id) throw new AuthError(i18next.t("error.unauthorized"));

  const logoUrl = `/companies/uploads/${file.filename}`;

  await CompaniesRepository.updateCompanyLogoById(companyId, logoUrl);

  return { logo_url: logoUrl, companyId };
};

export {
  addCompany,
  putCompanyById,
  deleteCompanyById,
  getAllCompanies,
  getCompanyById,
  uploadLogo,
};
