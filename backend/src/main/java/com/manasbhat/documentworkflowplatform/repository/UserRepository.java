package com.manasbhat.documentworkflowplatform.repository;

import com.manasbhat.documentworkflowplatform.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import com.manasbhat.documentworkflowplatform.entity.Role;
import org.springframework.data.mongodb.repository.Query;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRoleAndEnabledTrue(Role role);

    long countByRoleAndEnabledTrue(Role role);

    @Query("{ 'enabled': true, '$or': [ "
            + "{ 'fullName': { '$regex': ?0, '$options': 'i' } }, "
            + "{ 'email': { '$regex': ?0, '$options': 'i' } } "
            + "] }")
    List<User> searchEnabledUsers(String search);

}